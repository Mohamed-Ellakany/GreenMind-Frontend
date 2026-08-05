import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { GreenmindApi } from '@core/api/greenmind-api.service';
import { DiagnosisChatPage } from './diagnosis-chat-page';
import { PhaseTwoApi } from './phase-two-api.service';
import { DiagnosisDetail, DiagnosisTurn } from './phase-two.models';

describe('DiagnosisChatPage', () => {
  let fixture: ComponentFixture<DiagnosisChatPage>;
  let component: DiagnosisChatPage;
  let api: {
    diagnosis: ReturnType<typeof vi.fn>;
    finalizeDiagnosis: ReturnType<typeof vi.fn>;
    sendDiagnosisMessage: ReturnType<typeof vi.fn>;
    diagnosisImage: ReturnType<typeof vi.fn>;
  };

  const draft: DiagnosisDetail = {
    summary: {
      id: 9, exportPlanId: 2, title: 'تشخيص جديد', status: 'مسودة',
      observationDate: '2026-08-05', suspectedDisease: null, confidencePercentage: null,
      severity: null, imageCount: 0, finalizedWithOverride: false,
      knowledgeVerified: false, createdAt: '2026-08-05T10:00:00Z',
      closedAtUtc: null, completedAtUtc: null,
    },
    readiness: {
      isReady: false,
      checklist: [{ key: 'image', label: 'صورة واضحة للحالة', isComplete: false, isRequired: true }],
      missingItems: ['صورة واضحة للحالة'],
    },
    facts: { affectedPart: null, onset: null, spreadPattern: null, affectedExtent: null, conditions: null, previousTreatments: null },
    recommendedActions: null, advisoryWarning: null, exportImpact: null,
    failureMessage: null, knowledgeFailureMessage: null, treatmentProposalId: null,
    messages: [], sources: [],
  };

  beforeEach(async () => {
    const waiting: DiagnosisDetail = {
      ...draft,
      summary: { ...draft.summary, status: 'قيد الانتظار', finalizedWithOverride: true, closedAtUtc: '2026-08-05T11:00:00Z' },
    };
    api = {
      diagnosis: vi.fn(() => of(draft)),
      finalizeDiagnosis: vi.fn(() => of(waiting)),
      sendDiagnosisMessage: vi.fn(),
      diagnosisImage: vi.fn(() => of(new Blob())),
    };
    await TestBed.configureTestingModule({
      imports: [DiagnosisChatPage],
      providers: [
        provideRouter([]),
        { provide: PhaseTwoApi, useValue: api },
        { provide: GreenmindApi, useValue: { exportPlan: vi.fn(() => of({ id: 2, name: 'خطة فراولة', crop: 'Strawberry' })) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: '2', diagnosisId: '9' }) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiagnosisChatPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fixture.destroy();
  });

  it('requires explicit confirmation before an early diagnosis', () => {
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.finalizeDiagnosis();
    expect(api.finalizeDiagnosis).not.toHaveBeenCalled();

    confirmation.mockReturnValue(true);
    component.finalizeDiagnosis();
    expect(api.finalizeDiagnosis).toHaveBeenCalledWith(2, 9, true);
    expect(component.isProcessing()).toBe(true);
  });

  it('renders a locked result with confidence and documented sources', () => {
    component.diagnosis.set({
      ...draft,
      summary: {
        ...draft.summary,
        status: 'مكتمل', suspectedDisease: 'العفن الرمادي', confidencePercentage: 82,
        severity: 'متوسط', knowledgeVerified: true, completedAtUtc: '2026-08-05T11:05:00Z',
      },
      recommendedActions: 'اعزل الثمار المصابة وراقب الرطوبة.',
      advisoryWarning: 'النتيجة استشارية.',
      sources: [{
        id: 1, sourceName: 'UC IPM Strawberry', sourceUrl: 'https://ipm.ucanr.edu/agriculture/strawberry/',
        publisher: 'UC ANR', sectionReference: 'Diseases', excerpt: 'Trusted evidence.',
        retrievedAtUtc: '2026-08-05T11:04:00Z', isOfficialOrAcademic: true,
      }],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('العفن الرمادي');
    expect(fixture.nativeElement.textContent).toContain('82%');
    expect(fixture.nativeElement.textContent).toContain('UC IPM Strawberry');
  });

  it('shows the user message immediately and sends it when Enter is pressed', () => {
    const response = new Subject<DiagnosisTurn>();
    api.sendDiagnosisMessage.mockReturnValue(response);
    component.message = 'من يومين والجو كان كويس';
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });

    component.onMessageKeydown(event);
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(true);
    expect(api.sendDiagnosisMessage).toHaveBeenCalledWith(2, 9, 'من يومين والجو كان كويس', []);
    expect(component.pendingMessage()?.content).toBe('من يومين والجو كان كويس');
    expect(fixture.nativeElement.textContent).toContain('جارٍ الإرسال');
    expect(fixture.nativeElement.textContent).toContain('من يومين والجو كان كويس');
  });

  it('keeps Shift+Enter for a new line', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, cancelable: true });

    component.onMessageKeydown(event);

    expect(event.defaultPrevented).toBe(false);
    expect(api.sendDiagnosisMessage).not.toHaveBeenCalled();
  });

  it('allows sending images without text', () => {
    const response = new Subject<DiagnosisTurn>();
    api.sendDiagnosisMessage.mockReturnValue(response);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const image = new File(['image'], 'leaf.png', { type: 'image/png' });
    component.selectedImages = [image];

    component.send();
    fixture.detectChanges();

    expect(api.sendDiagnosisMessage).toHaveBeenCalledWith(2, 9, '', [image]);
    expect(component.pendingMessage()?.images).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.diagnosis-message.pending img')?.getAttribute('src')).toBe('blob:preview');
  });
});
