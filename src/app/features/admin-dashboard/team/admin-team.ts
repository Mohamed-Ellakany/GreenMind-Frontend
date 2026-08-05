import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { AdminInvitation, AdminUser } from '@core/api/api.models';
import { AuthService } from '@features/auth/services/AuthService';

@Component({
  selector: 'app-admin-team',
  imports: [FormsModule],
  templateUrl: './admin-team.html',
})
export class AdminTeam {
  private readonly api = inject(GreenmindApi);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly admins = signal<AdminUser[]>([]);
  protected readonly invitations = signal<AdminInvitation[]>([]);
  protected readonly loading = signal(false);
  protected readonly inviteLoading = signal(false);
  protected readonly actionLoadingId = signal<number | null>(null);
  protected readonly message = signal('');
  protected readonly messageType = signal<'success' | 'error' | 'info'>('info');
  protected readonly isSuperAdmin = this.auth.hasRole('SuperAdmin');
  protected readonly pendingInvitations = computed(() =>
    this.invitations().filter((item) => !item.acceptedAtUtc && !item.revokedAtUtc),
  );

  protected fullName = '';
  protected email = '';

  constructor() {
    if (this.isSuperAdmin) {
      this.load();
    }
  }

  protected load(): void {
    this.loading.set(true);

    this.api
      .admins()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (value) => this.admins.set(value),
        error: () => this.showMessage('تعذر تحميل بيانات المدراء.', 'error'),
      });

    this.api
      .adminInvitations()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (value) => this.invitations.set(value),
        error: () => this.showMessage('تعذر تحميل الدعوات المعلقة.', 'error'),
      });
  }

  protected invite(): void {
    const fullName = this.fullName.trim();
    const email = this.email.trim();

    if (!fullName || !email || this.inviteLoading()) {
      return;
    }

    this.inviteLoading.set(true);
    this.api
      .inviteAdmin({ fullName, email })
      .pipe(
        finalize(() => this.inviteLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.showMessage('تم إرسال دعوة المدير بنجاح.', 'success');
          this.fullName = '';
          this.email = '';
          this.load();
        },
        error: (error: HttpErrorResponse) => this.showMessage(this.invitationError(error), 'error'),
      });
  }

  protected toggle(admin: AdminUser): void {
    this.api
      .setAdminActive(admin.id, !admin.isActive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(),
        error: () => this.showMessage('تعذر تغيير حالة المدير.', 'error'),
      });
  }

  protected resend(item: AdminInvitation): void {
    this.actionLoadingId.set(item.id);
    this.api
      .resendAdminInvitation(item.id)
      .pipe(
        finalize(() => this.actionLoadingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.showMessage('تمت إعادة إرسال الدعوة.', 'success');
          this.load();
        },
        error: (error: HttpErrorResponse) => this.showMessage(this.invitationError(error), 'error'),
      });
  }

  protected revoke(item: AdminInvitation): void {
    this.actionLoadingId.set(item.id);
    this.api
      .revokeAdminInvitation(item.id)
      .pipe(
        finalize(() => this.actionLoadingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.showMessage('تم إلغاء الدعوة.', 'success');
          this.load();
        },
        error: () => this.showMessage('تعذر إلغاء الدعوة.', 'error'),
      });
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.message.set(message);
    this.messageType.set(type);
  }

  private invitationError(error: HttpErrorResponse): string {
    if (error.status === 503) {
      return 'خدمة البريد غير مهيأة أو رفضت الرسالة. تحقق من بيانات SMTP ونطاق المرسل.';
    }

    if (error.status === 409) {
      return error.error?.error?.message ?? 'يوجد حساب أو دعوة فعالة لهذا البريد الإلكتروني.';
    }

    if (error.status === 400) {
      return 'تحقق من الاسم وصحة البريد الإلكتروني.';
    }

    return 'تعذر إرسال الدعوة. حاول مرة أخرى.';
  }
}
