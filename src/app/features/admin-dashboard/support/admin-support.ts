import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ContactMessage, SupportConversation, SupportMessage } from '@core/api/api.models';
import { SupportRealtimeService } from '@core/support/support-realtime.service';

type ActiveTab = 'support' | 'contact-messages';

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-support.html',
  styleUrl: './admin-support.css',
})
export class AdminSupport {
  private readonly api = inject(GreenmindApi);
  private readonly realtime = inject(SupportRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly activeTab = signal<ActiveTab>('support');

  public encodeURIComponent(val: string): string {
    return encodeURIComponent(val || '');
  }

  // Support Conversations State
  protected readonly conversations = signal<SupportConversation[]>([]);
  protected readonly activeConversation = signal<SupportConversation | null>(null);
  protected readonly messages = signal<SupportMessage[]>([]);
  protected readonly loadingConversations = signal(false);
  protected readonly loadingMessages = signal(false);
  protected readonly sending = signal(false);
  protected readonly error = signal('');
  private readonly messagesViewport = viewChild<ElementRef<HTMLElement>>('messagesViewport');
  protected draft = '';

  // Contact Inquiries State
  public readonly contactMessages = signal<ContactMessage[]>([]);
  public readonly activeContactMessage = signal<ContactMessage | null>(null);
  public readonly loadingContactMessages = signal(false);
  public readonly unreadContactCount = signal(0);
  public readonly contactSearchQuery = signal('');
  public readonly contactUnreadOnly = signal(false);
  public readonly contactActionLoading = signal<number | null>(null);

  constructor() {
    void this.realtime.start();
    this.loadConversations();
    this.loadContactMessages();

    effect(() => {
      const message = this.realtime.latestMessage();
      if (!message) return;

      this.loadConversations(false);
      if (this.activeConversation()?.id === message.conversationId) {
        this.addMessage(message);
      }
    });
  }

  public setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    if (tab === 'contact-messages' && this.contactMessages().length === 0) {
      this.loadContactMessages();
    }
  }

  // --- Support Conversations ---
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
    this.messages.set([]);
    this.loadingMessages.set(true);
    this.error.set('');

    this.api
      .adminSupportMessages(conversation.id)
      .pipe(
        finalize(() => this.loadingMessages.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          this.messages.set(page.items);
          this.scrollToLatest();
        },
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

  protected onComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    this.send();
  }

  protected isMine(message: SupportMessage): boolean {
    const role = String(message.role).toLowerCase();
    return role === 'admin' || role === '2';
  }

  protected senderInitial(message: SupportMessage): string {
    const fallback = this.isMine(message) ? 'أ' : 'م';
    return message.senderName?.trim().charAt(0) || fallback;
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
    this.scrollToLatest(true);
  }

  private scrollToLatest(smooth = false): void {
    requestAnimationFrame(() => {
      const viewport = this.messagesViewport()?.nativeElement;
      viewport?.scrollTo({ top: viewport.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    });
  }

  // --- Contact Inquiries Logic ---
  public loadContactMessages(selectFirst = true): void {
    this.loadingContactMessages.set(true);
    this.api
      .adminContactMessages({
        unreadOnly: this.contactUnreadOnly() ? true : undefined,
        search: this.contactSearchQuery().trim() || undefined,
        pageNumber: 1,
        pageSize: 50,
      })
      .pipe(
        finalize(() => this.loadingContactMessages.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          this.contactMessages.set(page.items);
          this.unreadContactCount.set(page.unreadCount);
          if (selectFirst && page.items.length > 0) {
            this.selectContactMessage(page.items[0]);
          } else if (page.items.length === 0) {
            this.activeContactMessage.set(null);
          }
        },
        error: () => this.error.set('تعذر تحميل رسائل تواصل معنا.'),
      });
  }

  public selectContactMessage(msg: ContactMessage): void {
    this.activeContactMessage.set(msg);
    if (!msg.isRead) {
      this.markContactAsRead(msg);
    }
  }

  public markContactAsRead(msg: ContactMessage): void {
    this.contactActionLoading.set(msg.id);
    this.api
      .markContactMessageRead(msg.id, true)
      .pipe(
        finalize(() => this.contactActionLoading.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.contactMessages.update((list) =>
            list.map((item) => (item.id === updated.id ? updated : item))
          );
          if (this.activeContactMessage()?.id === updated.id) {
            this.activeContactMessage.set(updated);
          }
          this.unreadContactCount.update((c) => Math.max(0, c - 1));
        },
      });
  }

  public deleteContactMessage(msg: ContactMessage): void {
    if (!confirm(`هل أنت متأكد من حذف رسالة «${msg.fullName}»؟`)) return;

    this.contactActionLoading.set(msg.id);
    this.api
      .deleteContactMessage(msg.id)
      .pipe(
        finalize(() => this.contactActionLoading.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.contactMessages.update((list) => list.filter((item) => item.id !== msg.id));
          if (this.activeContactMessage()?.id === msg.id) {
            const remaining = this.contactMessages();
            this.activeContactMessage.set(remaining.length > 0 ? remaining[0] : null);
          }
          if (!msg.isRead) {
            this.unreadContactCount.update((c) => Math.max(0, c - 1));
          }
        },
        error: () => alert('تعذر حذف الرسالة.'),
      });
  }

  public onContactSearch(): void {
    this.loadContactMessages(true);
  }

  public toggleUnreadFilter(): void {
    this.contactUnreadOnly.update((v) => !v);
    this.loadContactMessages(true);
  }
}
