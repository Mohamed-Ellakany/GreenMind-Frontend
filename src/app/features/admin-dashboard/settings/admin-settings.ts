import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '@features/auth/services/AuthService';
import { meetsPasswordPolicy } from '@features/auth/utils/password-policy';

@Component({
  selector: 'app-admin-settings',
  imports: [FormsModule],
  templateUrl: './admin-settings.html',
})
export class AdminSettings {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly profileLoading = signal(false);
  protected readonly passwordLoading = signal(false);
  protected readonly message = signal('');
  protected readonly messageType = signal<'success' | 'error' | 'info'>('info');
  protected readonly profileFullName = signal('');
  protected readonly profileEmail = signal('');
  protected readonly isSuperAdmin = this.auth.hasRole('SuperAdmin');

  protected currentPassword = '';
  protected newPassword = '';
  protected confirmPassword = '';

  constructor() {
    this.loadProfile();
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

  protected profileInitial(): string {
    return (this.profileFullName().trim() || 'ح').charAt(0);
  }

  protected passwordIsStrong(): boolean {
    return meetsPasswordPolicy(this.newPassword);
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
}
