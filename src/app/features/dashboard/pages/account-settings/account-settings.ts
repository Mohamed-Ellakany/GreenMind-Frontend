import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@features/auth/services/AuthService';
import { meetsPasswordPolicy } from '@features/auth/utils/password-policy';

@Component({
  selector: 'app-account-settings',
  imports: [FormsModule],
  templateUrl: './account-settings.html',
})
export class AccountSettings {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly profile = this.auth.accountProfile;
  public readonly profileLoading = signal(false);
  public readonly farmLoading = signal(false);
  public readonly passwordLoading = signal(false);

  public profileFullName = '';
  public profileEmail = '';
  public farmName = '';
  public currentPassword = '';
  public newPassword = '';
  public confirmPassword = '';

  public constructor() {
    this.auth
      .profile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profileFullName = profile.fullName;
          this.profileEmail = profile.email ?? '';
          this.farmName = profile.farmName ?? '';
        },
        error: () => this.toast.error('تعذر تحميل بيانات حسابك.'),
      });
  }

  public saveProfile(): void {
    const fullName = this.profileFullName.trim();
    const email = this.profileEmail.trim();

    if (!fullName || !email || this.profileLoading()) return;

    this.profileLoading.set(true);
    this.auth
      .updateProfile({ fullName, email })
      .pipe(
        finalize(() => this.profileLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => {
          this.profileFullName = profile.fullName;
          this.profileEmail = profile.email ?? '';
          this.toast.success('تم حفظ بيانات الحساب.');
        },
        error: (error: HttpErrorResponse) => this.toast.error(this.profileError(error)),
      });
  }

  public saveFarm(): void {
    const farmName = this.farmName.trim();
    if (!farmName || this.farmLoading()) return;

    this.farmLoading.set(true);
    this.auth
      .updateFarm({ farmName })
      .pipe(
        finalize(() => this.farmLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => {
          this.farmName = profile.farmName ?? farmName;
          this.toast.success('تم تحديث اسم المزرعة.');
        },
        error: (error: HttpErrorResponse) => this.toast.error(this.farmError(error)),
      });
  }

  public changePassword(): void {
    if (!this.passwordIsStrong()) {
      this.toast.error('استخدم كلمة مرور أقوى تستوفي المتطلبات الموضحة.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toast.error('كلمتا المرور غير متطابقتين.');
      return;
    }

    if (!this.currentPassword || this.passwordLoading()) return;

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
          this.toast.success('تم تغيير كلمة المرور بنجاح.');
        },
        error: () =>
          this.toast.error('تعذر تغيير كلمة المرور. تحقق من كلمة المرور الحالية وحاول مجددًا.'),
      });
  }

  public passwordIsStrong(): boolean {
    return meetsPasswordPolicy(this.newPassword);
  }

  private profileError(error: HttpErrorResponse): string {
    if (error.status === 409) {
      return 'البريد الإلكتروني مستخدم في حساب آخر.';
    }

    if (error.status === 400) {
      return 'تحقق من الاسم وصحة البريد الإلكتروني.';
    }

    return 'تعذر حفظ بيانات الحساب. حاول مرة أخرى.';
  }

  private farmError(error: HttpErrorResponse): string {
    if (error.status === 400) {
      return 'اكتب اسم مزرعة صحيح لا يتجاوز 200 حرف.';
    }

    return 'تعذر تحديث بيانات المزرعة. حاول مرة أخرى.';
  }
}
