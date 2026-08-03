import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { AdminInvitation, AdminUser } from '@core/api/api.models';
import { AuthService } from '@features/auth/services/AuthService';

@Component({
  selector: 'app-admin-settings',
  imports: [FormsModule],
  templateUrl: './admin-settings.html',
})
export class AdminSettings {
  private readonly api = inject(GreenmindApi);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly admins = signal<AdminUser[]>([]);
  protected readonly invitations = signal<AdminInvitation[]>([]);
  protected readonly loading = signal(false);
  protected readonly inviteLoading = signal(false);
  protected readonly actionLoadingId = signal<number | null>(null);
  protected readonly profileLoading = signal(false);
  protected readonly passwordLoading = signal(false);
  protected readonly message = signal('');
  protected readonly messageType = signal<'success' | 'error' | 'info'>('info');
  protected readonly profileFullName = signal('');
  protected readonly profileEmail = signal('');
  protected readonly isSuperAdmin = this.auth.hasRole('SuperAdmin');
  protected readonly pendingInvitations = computed(() =>
    this.invitations().filter((item) => !item.acceptedAtUtc && !item.revokedAtUtc),
  );

  protected currentPassword = '';
  protected newPassword = '';
  protected confirmPassword = '';
  protected fullName = '';
  protected email = '';

  constructor() {
    this.loadProfile();
    if (this.isSuperAdmin) {
      this.load();
    }
  }

  protected loadProfile(): void {
    this.auth
      .profile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profileFullName.set(profile.fullName);
          this.profileEmail.set(profile.email ?? '');
        },
        error: () => this.showMessage('تعذر تحميل بيانات حسابك.', 'error'),
      });
  }

  protected saveProfile(): void {
    const fullName = this.profileFullName().trim();
    const email = this.profileEmail().trim();

    if (!fullName || !email || this.profileLoading()) {
      return;
    }

    this.profileLoading.set(true);
    this.auth
      .updateProfile({ fullName, email })
      .pipe(
        finalize(() => this.profileLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => {
          this.profileFullName.set(profile.fullName);
          this.profileEmail.set(profile.email ?? '');
          this.showMessage('تم تحديث بيانات حسابك.', 'success');
          if (this.isSuperAdmin) {
            this.load();
          }
        },
        error: (error: HttpErrorResponse) => this.showMessage(this.profileError(error), 'error'),
      });
  }

  protected changePassword(): void {
    if (!this.passwordIsStrong()) {
      this.showMessage('استخدم كلمة مرور أقوى تستوفي المتطلبات الموضحة.', 'error');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showMessage('كلمة المرور الجديدة وتأكيدها غير متطابقين.', 'error');
      return;
    }

    if (!this.currentPassword || !this.newPassword || this.passwordLoading()) {
      return;
    }

    this.passwordLoading.set(true);
    this.auth
      .changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
      })
      .pipe(
        finalize(() => this.passwordLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.showMessage('تم تغيير كلمة المرور.', 'success');
        },
        error: () =>
          this.showMessage(
            'تعذر تغيير كلمة المرور. تحقق من كلمة المرور الحالية والمحاولة مرة أخرى.',
            'error',
          ),
      });
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

  protected profileInitial(): string {
    return (this.profileFullName().trim() || 'ح').charAt(0);
  }

  protected passwordIsStrong(): boolean {
    return (
      this.newPassword.length >= 8 &&
      /[A-Z]/.test(this.newPassword) &&
      /[a-z]/.test(this.newPassword) &&
      /\d/.test(this.newPassword) &&
      /[^A-Za-z0-9]/.test(this.newPassword)
    );
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.message.set(message);
    this.messageType.set(type);
  }

  private profileError(error: HttpErrorResponse): string {
    if (error.status === 409) {
      return 'يوجد حساب آخر يستخدم هذا البريد الإلكتروني.';
    }

    if (error.status === 400) {
      return 'تحقق من الاسم وصحة البريد الإلكتروني.';
    }

    return 'تعذر تحديث بيانات الحساب. حاول مرة أخرى.';
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
