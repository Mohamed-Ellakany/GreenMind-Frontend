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
  private sequence = 0;
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
    this.push('رد جديد من فريق الدعم', body);
  }

  public pushCustomerMessage(senderName: string, body: string): void {
    this.push(`رسالة دعم جديدة من ${senderName || 'أحد العملاء'}`, body);
  }

  private push(title: string, body: string): void {
    const trimmedBody = body.trim();
    this.notifications.update((items) => [
      {
        id: Date.now() * 100 + this.sequence++ % 100,
        title,
        body: trimmedBody.length > 140 ? `${trimmedBody.slice(0, 137)}...` : trimmedBody,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...items,
    ].slice(0, 50));
  }
}
