import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@features/auth/services/AuthService';
import {
  NotificationCenterService,
  NotificationChannel,
} from '@core/settings/notification-center.service';

type ChannelOption = {
  key: NotificationChannel;
  label: string;
  description: string;
};

@Component({
  selector: 'app-account-settings',
  imports: [FormsModule],
  templateUrl: './account-settings.html',
})
export class AccountSettings {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  public readonly notifications = inject(NotificationCenterService);

  public readonly profile = this.auth.accountProfile;
  public readonly profileLoading = signal(false);
  public readonly passwordLoading = signal(false);
  public readonly browserPermission = signal<NotificationPermission | 'unsupported' | 'default'>(
    'Notification' in window ? window.Notification.permission : 'unsupported',
  );

  public profileFullName = '';
  public profileEmail = '';
  public currentPassword = '';
  public newPassword = '';
  public confirmPassword = '';

  public readonly channels: ChannelOption[] = [
    {
      key: 'tasks',
      label: 'المهام اليومية',
      description: 'تذكير بالمهام المتأخرة والمهام المطلوبة اليوم.',
    },
    {
      key: 'compliance',
      label: 'الامتثال والمبيدات',
      description: 'تنبيهات المواد الفعالة وMRL وملاحظات التصدير.',
    },
    {
      key: 'weather',
      label: 'الطقس والري',
      description: 'موجات الحرارة، الرطوبة، وأي توصية تؤثر على الري.',
    },
    {
      key: 'costs',
      label: 'التكاليف والميزانية',
      description: 'تحذيرات تجاوز الميزانية ونواقص المرفقات.',
    },
    {
      key: 'markets',
      label: 'مقارنة الأسواق',
      description: 'نتائج وتوصيات المقارنات بين وجهات التصدير.',
    },
  ];

  public constructor() {
    this.auth
      .profile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.profileFullName = profile.fullName;
          this.profileEmail = profile.email ?? '';
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

  public toggleChannel(channel: NotificationChannel, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.notifications.setPreference(channel, checked);
    this.toast.success(checked ? 'تم تفعيل التنبيه.' : 'تم إيقاف التنبيه.');
  }

  public async enableBrowserNotifications(): Promise<void> {
    const result = await this.notifications.requestBrowserPermission();
    this.browserPermission.set(result);
    if (result === 'granted') {
      this.toast.success('تم تفعيل تنبيهات المتصفح.');
      this.notifications.push({
        title: 'تم تشغيل التنبيهات',
        body: 'ستظهر تنبيهات GreenMind المهمة في مركز التنبيهات.',
        channel: 'tasks',
        tone: 'success',
      });
      return;
    }

    if (result === 'unsupported') {
      this.toast.error('المتصفح الحالي لا يدعم التنبيهات.');
      return;
    }

    this.toast.error('لم يتم منح صلاحية تنبيهات المتصفح.');
  }

  public passwordIsStrong(): boolean {
    return (
      this.newPassword.length >= 8 &&
      /[A-Z]/.test(this.newPassword) &&
      /[a-z]/.test(this.newPassword) &&
      /\d/.test(this.newPassword) &&
      /[^A-Za-z0-9]/.test(this.newPassword)
    );
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
}
