import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlanDetails } from '@core/api/api.models';
import { AgriculturalAdvisorPage } from './agricultural-advisor-page';
import { PhaseTwoApi } from './phase-two-api.service';

describe('AgriculturalAdvisorPage', () => {
  let fixture: ComponentFixture<AgriculturalAdvisorPage>;
  let component: AgriculturalAdvisorPage;
  let api: {
    sessions: ReturnType<typeof vi.fn>;
    createSession: ReturnType<typeof vi.fn>;
    messages: ReturnType<typeof vi.fn>;
    streamMessage: ReturnType<typeof vi.fn>;
  };

  const plan: ExportPlanDetails = {
    id: 2,
    name: 'تصدير الفراولة',
    cropId: 1,
    crop: 'Strawberry',
    supportsSmartDiagnosis: true,
    destinationId: 1,
    destination: 'European Union',
    governorate: 'القاهرة',
    city: 'القاهرة',
    latitude: 30,
    longitude: 31,
    areaInFeddan: 10,
    plantingDate: '2026-08-01',
    expectedHarvestDate: '2026-11-02',
    expectedExportDate: '2026-11-09',
    status: 'Active',
    planningStatus: 'Succeeded',
    generatedTaskCount: 12,
    notes: null,
    planningFailureMessage: null,
  };

  beforeEach(async () => {
    api = {
      sessions: vi.fn(() => of([{ id: 7, title: 'الخطة', scope: 'ExportPlan', exportPlanId: 2, updatedAtUtc: null }])),
      createSession: vi.fn(),
      messages: vi.fn((_planId: number, _sessionId: number, pageNumber = 1) => of(pageNumber === 2
        ? {
            items: [{ id: 101, role: 'المساعد', content: 'آخر رسالة', status: 'مكتمل', createdAt: '2026-08-04T12:00:00Z' }],
            pageNumber: 2,
            pageSize: 100,
            totalCount: 101,
          }
        : {
            items: [{ id: 1, role: 'المساعد', content: 'أول رسالة', status: 'مكتمل', createdAt: '2026-08-04T11:00:00Z' }],
            pageNumber: 1,
            pageSize: 100,
            totalCount: 101,
          })),
      streamMessage: vi.fn(() => Promise.resolve()),
    };

    await TestBed.configureTestingModule({
      imports: [AgriculturalAdvisorPage],
      providers: [
        { provide: PhaseTwoApi, useValue: api },
        { provide: GreenmindApi, useValue: { exportPlan: vi.fn(() => of(plan)) } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '2' }),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AgriculturalAdvisorPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('sends with Enter and keeps Shift+Enter for a new line', () => {
    const send = vi.spyOn(component, 'sendChat').mockResolvedValue();
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    const shiftEnter = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, cancelable: true });

    component.onComposerKeydown(enter);
    component.onComposerKeydown(shiftEnter);

    expect(enter.defaultPrevented).toBe(true);
    expect(shiftEnter.defaultPrevented).toBe(false);
    expect(send).toHaveBeenCalledOnce();
  });

  it('removes raw markdown markers from assistant replies', () => {
    expect(component.formatMessageContent('### المشكلة\n- **المادة موجودة**\n---'))
      .toBe('المشكلة\n• المادة موجودة');
  });

  it('renders plan context and an accessible composer', () => {
    expect(fixture.nativeElement.textContent).toContain('Strawberry');
    expect(fixture.nativeElement.textContent).toContain('European Union');
    expect(fixture.nativeElement.querySelector('textarea[aria-label="اكتب رسالتك"]')).not.toBeNull();
  });

  it('loads the latest page of a long conversation', () => {
    expect(api.messages).toHaveBeenCalledWith(2, 7, 2);
    expect(component.chatMessages()[0].content).toBe('آخر رسالة');
  });
});
