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
});
