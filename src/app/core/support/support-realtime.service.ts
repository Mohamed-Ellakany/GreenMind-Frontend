import { Injectable, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { SupportMessage } from '@core/api/api.models';
import { AuthService } from '@features/auth/services/AuthService';
import { NotificationCenterService } from '@core/settings/notification-center.service';

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

    this.connection = new HubConnectionBuilder()
      .withUrl('/hubs/support', {
        accessTokenFactory: () => this.auth.getToken() ?? '',
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on('SupportMessageReceived', (message: SupportMessage) => {
      this.latestMessage.set(message);
      if (this.auth.hasRole('FarmOwner') && message.role === 'Admin') {
        this.notifications.pushAdminReply(message.content);
      }
    });

    await this.connection.start();
  }

  public async stop(): Promise<void> {
    if (!this.connection || this.connection.state === HubConnectionState.Disconnected) return;
    await this.connection.stop();
  }
}
