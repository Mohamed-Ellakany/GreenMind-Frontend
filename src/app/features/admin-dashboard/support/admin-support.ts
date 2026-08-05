import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { SupportConversation, SupportMessage } from '@core/api/api.models';
import { SupportRealtimeService } from '@core/support/support-realtime.service';

@Component({
  selector: 'app-admin-support',
  imports: [FormsModule],
  templateUrl: './admin-support.html',
})
export class AdminSupport {
  private readonly api = inject(GreenmindApi);
  private readonly realtime = inject(SupportRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly conversations = signal<SupportConversation[]>([]);
  protected readonly activeConversation = signal<SupportConversation | null>(null);
  protected readonly messages = signal<SupportMessage[]>([]);
  protected readonly loadingConversations = signal(false);
  protected readonly loadingMessages = signal(false);
  protected readonly sending = signal(false);
  protected readonly error = signal('');
  protected draft = '';

  constructor() {
    void this.realtime.start();
    this.loadConversations();

    effect(() => {
      const message = this.realtime.latestMessage();
      if (!message) return;

      this.loadConversations(false);
      if (this.activeConversation()?.id === message.conversationId) {
        this.addMessage(message);
      }
    });
  }

  protected loadConversations(selectFirst = true): void {
    this.loadingConversations.set(true);
    this.api
      .adminSupportConversations()
      .pipe(
        finalize(() => this.loadingConversations.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (items) => {
          this.conversations.set(items);
          const activeId = this.activeConversation()?.id;
          const updatedActive = activeId ? items.find((item) => item.id === activeId) ?? null : null;
          if (updatedActive) {
            this.activeConversation.set(updatedActive);
            return;
          }
          if (selectFirst && items.length > 0) {
            this.selectConversation(items[0]);
          }
        },
        error: () => this.error.set('تعذر تحميل محادثات الدعم.'),
      });
  }

  protected selectConversation(conversation: SupportConversation): void {
    this.activeConversation.set(conversation);
    this.loadingMessages.set(true);
    this.error.set('');

    this.api
      .adminSupportMessages(conversation.id)
      .pipe(
        finalize(() => this.loadingMessages.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => this.messages.set(page.items),
        error: () => this.error.set('تعذر تحميل رسائل هذه المحادثة.'),
      });
  }

  protected send(): void {
    const conversation = this.activeConversation();
    const content = this.draft.trim();
    if (!conversation || !content || this.sending()) return;

    this.sending.set(true);
    this.api
      .sendAdminSupportMessage(conversation.id, content)
      .pipe(
        finalize(() => this.sending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (message) => {
          this.draft = '';
          this.addMessage(message);
          this.loadConversations(false);
        },
        error: () => this.error.set('تعذر إرسال الرد. حاول مرة أخرى.'),
      });
  }

  protected messageTime(value: string | null): string {
    if (!value) return 'لا توجد رسائل';
    return new Intl.DateTimeFormat('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    }).format(new Date(value));
  }

  private addMessage(message: SupportMessage): void {
    this.messages.update((items) => {
      if (items.some((item) => item.id === message.id)) return items;
      return [...items, message].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    });
  }
}
