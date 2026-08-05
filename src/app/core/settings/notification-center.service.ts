import { computed, Injectable, signal } from '@angular/core';

export type AppNotification = {
  id: number;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  public readonly notifications = signal<AppNotification[]>([]);
  public readonly visibleNotifications = this.notifications;
  public readonly unreadCount = computed(() =>
    this.notifications().filter((notification) => !notification.read).length);

  public markAllRead(): void {
    this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
  }

  public markRead(id: number): void {
    this.notifications.update((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }

  public pushAdminReply(body: string): void {
    this.notifications.update((items) => [
      {
        id: Date.now(),
        title: 'رد الأدمن على رسالتك',
        body,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...items,
    ]);
  }
}
