import { Injectable, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { SupportMessage } from '@core/api/api.models';
import { AuthService } from '@features/auth/services/AuthService';
import { NotificationCenterService } from '@core/settings/notification-center.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupportRealtimeService {
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationCenterService);
  private connection: HubConnection | null = null;
  public readonly latestMessage = signal<SupportMessage | null>(null);

  public async start(): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected ||
        this.connection?.state === HubConnectionState.Connecting) {
      return;
    }

    const base = (environment.apiBaseUrl || '').replace(/\/+$/, '');
    const hubUrl = base ? `${base}/hubs/support` : '/hubs/support';

    this.connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => this.auth.getToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('SupportMessageReceived', (message: SupportMessage) => {
      const normalizedMessage = this.normalizeMessage(message);
      this.latestMessage.set(normalizedMessage);
      const role = String(normalizedMessage.role).toLowerCase();
      if (this.auth.hasRole('FarmOwner') && role === 'admin') {
        this.notifications.pushAdminReply(normalizedMessage.content);
      }
      if (this.auth.hasRole('Admin') && role === 'customer') {
        this.notifications.pushCustomerMessage(normalizedMessage.senderName, normalizedMessage.content);
      }
    });

    await this.connection.start();
  }

  public async stop(): Promise<void> {
    if (!this.connection || this.connection.state === HubConnectionState.Disconnected) return;
    await this.connection.stop();
  }

  private normalizeMessage(message: SupportMessage): SupportMessage {
    const role = String(message.role).toLowerCase();
    if (role === '1') return { ...message, role: 'Customer' };
    if (role === '2') return { ...message, role: 'Admin' };
    return message;
  }
}
