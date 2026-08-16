import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { PhaseTwoApi } from '../../phase-two/phase-two-api.service';
import { ChatSession } from '../../phase-two/phase-two.models';
import { AiAgent } from './ai-agent';

describe('AiAgent', () => {
  let fixture: ComponentFixture<AiAgent>;
  let component: AiAgent;
  let api: {
    farmSessions: ReturnType<typeof vi.fn>;
    createFarmSession: ReturnType<typeof vi.fn>;
    farmMessages: ReturnType<typeof vi.fn>;
    streamFarmMessage: ReturnType<typeof vi.fn>;
    budgetStatus: ReturnType<typeof vi.fn>;
    submitLimitRequest: ReturnType<typeof vi.fn>;
  };

  const initialSession: ChatSession = {
    id: 42,
    title: 'Farm advisor',
    scope: 'Farm',
    exportPlanId: null,
    updatedAtUtc: null,
  };

  beforeEach(async () => {
    api = {
      farmSessions: vi.fn(() => of([])),
      createFarmSession: vi.fn(() => of(initialSession)),
      farmMessages: vi.fn(() => of({ items: [], pageNumber: 1, pageSize: 100, totalCount: 0 })),
      streamFarmMessage: vi.fn(() => Promise.resolve()),
      budgetStatus: vi.fn(() => of({ limitUsd: 0.10, usedUsd: 0.05, isExceeded: false, hasPendingRequest: false })),
      submitLimitRequest: vi.fn(() => of(undefined)),
    };

    await TestBed.configureTestingModule({
      imports: [AiAgent],
      providers: [{ provide: PhaseTwoApi, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(AiAgent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates and selects an initial session when the account has no chat history', () => {
    expect(api.createFarmSession).toHaveBeenCalledOnce();
    expect(component.selectedSession()).toEqual(initialSession);
    expect(component.loading()).toBe(false);
  });

  it('enables the send button after entering a message in the initial session', () => {
    component.messageInput = 'Review my export plans';
    fixture.detectChanges();

    const sendButton = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;

    expect(sendButton.disabled).toBe(false);
  });

  it('uses the Egyptian assistant identity for legacy default session titles', () => {
    expect(component.displaySessionTitle('Farm advisor')).toBe('محادثة مع عم خضر');
    expect(fixture.nativeElement.textContent).toContain('عم خضر');
  });

  it('collapses and restores the conversation history', () => {
    const toggle = fixture.nativeElement.querySelector('.history-toggle') as HTMLButtonElement;

    toggle.click();
    fixture.detectChanges();

    expect(component.historyCollapsed()).toBe(true);
    expect(fixture.nativeElement.querySelector('.chat-sidebar--collapsed')).not.toBeNull();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    expect(component.historyCollapsed()).toBe(false);
  });

  it('uses the first user question as the conversation title immediately', async () => {
    component.messageInput = '  ما حالة   خطة التصدير اليوم؟  ';

    await component.send();

    expect(component.selectedSession()?.title).toBe('ما حالة خطة التصدير اليوم؟');
  });

  it('renders assistant markdown as structured HTML and escapes raw tags', () => {
    const html = component.renderAssistantMessage('## ملخص\n- **مهم**\n<script>alert(1)</script>');

    expect(html).toContain('<h3>ملخص</h3>');
    expect(html).toContain('<li><strong>مهم</strong></li>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('restores an unsent message when all connection attempts fail', async () => {
    api.streamFarmMessage.mockRejectedValueOnce(new TypeError('connection refused'));
    component.messageInput = 'راجع حالة المزرعة';

    await component.send();

    expect(component.messageInput).toBe('راجع حالة المزرعة');
    expect(component.messages()).toEqual([]);
    expect(component.error()).toContain('رسالتك محفوظة');
    expect(component.sending()).toBe(false);
  });

  it('scrolls to the beginning of the newest message after the updated view is painted', async () => {
    const viewport = fixture.nativeElement.querySelector('.messages-viewport') as HTMLElement;
    const newestMessage = document.createElement('div');
    newestMessage.className = 'message-row';
    viewport.appendChild(newestMessage);
    let frameCallback: FrameRequestCallback | undefined;
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frameCallback = callback;
      return 1;
    }));
    vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({ top: 100 } as DOMRect);
    vi.spyOn(newestMessage, 'getBoundingClientRect').mockReturnValue({ top: 340 } as DOMRect);
    viewport.scrollTop = 40;

    (component as unknown as { scrollToNewestMessageStart(): void }).scrollToNewestMessageStart();
    await Promise.resolve();

    expect(viewport.scrollTop).toBe(40);
    expect(frameCallback).toBeDefined();

    frameCallback?.(0);

    expect(viewport.scrollTop).toBe(280);
    vi.unstubAllGlobals();
  });

  it('renders quota exceeded card and form when budget is exceeded', () => {
    component.budgetStatus.set({ limitUsd: 0.10, usedUsd: 0.12, isExceeded: true, hasPendingRequest: false });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.limit-exceeded-card')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('استنفدت حد استخدام الذكاء الاصطناعي');
    expect(fixture.nativeElement.querySelector('textarea[name="messageInput"]')).toBeNull();
  });

  it('submits quota limit request and renders success banner', () => {
    component.budgetStatus.set({ limitUsd: 0.10, usedUsd: 0.12, isExceeded: true, hasPendingRequest: false });
    component.limitContactName = 'محمد أحمد';
    component.limitContactPhone = '01012345678';
    fixture.detectChanges();

    component.submitLimitRequest();
    fixture.detectChanges();

    expect(api.submitLimitRequest).toHaveBeenCalledWith('محمد أحمد', '01012345678');
    expect(component.limitRequestSubmitted()).toBe(true);
    expect(fixture.nativeElement.querySelector('.limit-success-banner')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('تم إرسال طلبك بنجاح إلى المسؤول');
  });
});
