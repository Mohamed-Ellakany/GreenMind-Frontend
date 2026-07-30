import { computed, Injectable, signal } from '@angular/core';

export type NotificationChannel = 'tasks' | 'compliance' | 'weather' | 'costs' | 'markets';

export type NotificationPreferences = Record<NotificationChannel, boolean>;

export type AppNotification = {
  id: number;
  title: string;
  body: string;
  channel: NotificationChannel;
  tone: 'success' | 'warning' | 'danger' | 'info';
  read: boolean;
  createdAt: string;
};

const preferencesKey = 'greenmind_notification_preferences';

const defaultPreferences: NotificationPreferences = {
  tasks: true,
  compliance: true,
  weather: true,
  costs: true,
  markets: true,
};

const seedNotifications: AppNotification[] = [
  {
    id: 1,
    title: 'تنبيه امتثال',
    body: 'راجع حالة المواد الفعالة قبل تثبيت أي تطبيق مبيد في خطة الاتحاد الأوروبي.',
    channel: 'compliance',
    tone: 'warning',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'مهمة اليوم',
    body: 'يوجد مهام ري ومتابعة جودة تحتاج مراجعة قبل نهاية اليوم.',
    channel: 'tasks',
    tone: 'info',
    read: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'مقارنة الأسواق جاهزة',
    body: 'يمكنك الآن اختيار الخطة وبلدين ثم تشغيل المقارنة مباشرة.',
    channel: 'markets',
    tone: 'success',
    read: true,
    createdAt: new Date().toISOString(),
  },
];

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  public readonly preferences = signal<NotificationPreferences>(this.loadPreferences());
  public readonly notifications = signal<AppNotification[]>(seedNotifications);
  public readonly unreadCount = computed(() =>
    this.visibleNotifications().filter((notification) => !notification.read).length);
  public readonly visibleNotifications = computed(() =>
    this.notifications().filter((notification) => this.preferences()[notification.channel]));

  public setPreference(channel: NotificationChannel, enabled: boolean): void {
    this.preferences.update((current) => {
      const next = { ...current, [channel]: enabled };
      localStorage.setItem(preferencesKey, JSON.stringify(next));
      return next;
    });
  }

  public markAllRead(): void {
    this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
  }

  public markRead(id: number): void {
    this.notifications.update((items) => items.map((item) =>
      item.id === id ? { ...item, read: true } : item));
  }

  public push(notification: Omit<AppNotification, 'id' | 'read' | 'createdAt'>): void {
    this.notifications.update((items) => [
      {
        ...notification,
        id: Date.now(),
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...items,
    ]);
  }

  public async requestBrowserPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!('Notification' in window)) return 'unsupported';
    return window.Notification.requestPermission();
  }

  private loadPreferences(): NotificationPreferences {
    try {
      const raw = localStorage.getItem(preferencesKey);
      return raw ? { ...defaultPreferences, ...JSON.parse(raw) } : defaultPreferences;
    } catch {
      return defaultPreferences;
    }
  }
}
