import { Component, DestroyRef, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { SupportConversation, SupportMessage } from '@core/api/api.models';
import { SupportRealtimeService } from '@core/support/support-realtime.service';
import { ProductTourService } from '@core/tour/product-tour.service';

@Component({
  selector: 'app-support-page',
  imports: [FormsModule],
  templateUrl: './support-page.html',
  styleUrl: './support-page.css',
})
export class SupportPage {
  public readonly tour = inject(ProductTourService);
  private readonly api = inject(GreenmindApi);
  private readonly realtime = inject(SupportRealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly conversation = signal<SupportConversation | null>(null);
  protected readonly messages = signal<SupportMessage[]>([]);
  protected readonly loading = signal(false);
  protected readonly sending = signal(false);
  protected readonly error = signal('');
  private readonly messagesViewport = viewChild<ElementRef<HTMLElement>>('messagesViewport');
  protected draft = '';
  protected readonly supportTopics = ['مشكلة في الحساب', 'مساعدة في خطة التصدير', 'الإبلاغ عن مشكلة تقنية'];

  constructor() {
    void this.realtime.start();
    this.load();

    effect(() => {
      const message = this.realtime.latestMessage();
      const conversation = this.conversation();
      if (!message || !conversation || message.conversationId !== conversation.id) return;
      this.addMessage(message);
    });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');

    this.api
      .supportConversation()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (conversation) => this.conversation.set(conversation),
        error: () => this.error.set('تعذر فتح محادثة الدعم. حاول مرة أخرى.'),
      });

    this.api
      .supportMessages()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          this.messages.set(page.items);
          this.scrollToNewestMessageStart();
        },
        error: () => this.error.set('تعذر تحميل الرسائل.'),
      });
  }

  protected send(): void {
    const content = this.draft.trim();
    if (!content || this.sending()) return;

    this.sending.set(true);
    this.api
      .sendSupportMessage(content)
      .pipe(
        finalize(() => this.sending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (message) => {
          this.draft = '';
          this.addMessage(message);
        },
        error: () => this.error.set('تعذر إرسال الرسالة. حاول مرة أخرى.'),
      });
  }

  protected useTopic(topic: string): void {
    this.draft = topic;
  }

  protected onComposerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    this.send();
  }

  protected isMine(message: SupportMessage): boolean {
    return String(message.role).toLowerCase() === 'customer';
  }

  protected senderInitial(message: SupportMessage): string {
    const fallback = this.isMine(message) ? 'أ' : 'د';
    return message.senderName?.trim().charAt(0) || fallback;
  }

  protected messageTime(value: string): string {
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
    this.scrollToNewestMessageStart(true);
  }

  private scrollToNewestMessageStart(smooth = false): void {
    requestAnimationFrame(() => {
      const viewport = this.messagesViewport()?.nativeElement;
      if (!viewport) return;
      const newestMessage = viewport.querySelector<HTMLElement>('.support-message:last-child');
      if (!newestMessage) {
        viewport.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }
      const viewportTop = viewport.getBoundingClientRect().top;
      const messageTop = newestMessage.getBoundingClientRect().top;
      viewport.scrollTo({
        top: viewport.scrollTop + messageTop - viewportTop,
        behavior: smooth ? 'smooth' : 'auto',
      });
    });
  }
}
