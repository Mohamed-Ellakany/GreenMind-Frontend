import { Component, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@features/auth/services/AuthService';
import { NotificationCenterService, NotificationChannel } from '@core/settings/notification-center.service';

type ChannelOption = {
  key: NotificationChannel;
  label: string;
  description: string;
};

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.html',
})
export class AccountSettings {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastrService);
  public readonly notifications = inject(NotificationCenterService);

  public readonly profile = this.auth.accountProfile;
  public readonly browserPermission = signal<NotificationPermission | 'unsupported' | 'default'>(
    'Notification' in window ? window.Notification.permission : 'unsupported');

  public readonly channels: ChannelOption[] = [
    { key: 'tasks', label: 'المهام اليومية', description: 'تذكير بالمهام المتأخرة والمهام المطلوبة اليوم.' },
    { key: 'compliance', label: 'الامتثال والمبيدات', description: 'تنبيهات المواد الفعالة وMRL وملاحظات التصدير.' },
    { key: 'weather', label: 'الطقس والري', description: 'موجات الحرارة، الرطوبة، وأي توصية تؤثر على الري.' },
    { key: 'costs', label: 'التكاليف والميزانية', description: 'تحذيرات تجاوز الميزانية ونواقص المرفقات.' },
    { key: 'markets', label: 'مقارنة الأسواق', description: 'نتائج وتوصيات المقارنات بين وجهات التصدير.' },
  ];

  public constructor() {
    this.auth.loadProfile();
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
}
