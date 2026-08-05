import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlanDetails } from '@core/api/api.models';
import { CropHealthPage } from './crop-health-page';
import { PhaseTwoApi } from './phase-two-api.service';
import { DiagnosisDetail, DiagnosisSummary } from './phase-two.models';

describe('CropHealthPage', () => {
  let fixture: ComponentFixture<CropHealthPage>;
  let component: CropHealthPage;
  let router: Router;
  let api: { diagnoses: ReturnType<typeof vi.fn>; createDiagnosis: ReturnType<typeof vi.fn> };

  const plan = {
    id: 2,
    name: 'خطة فراولة',
    cropId: 1,
    crop: 'Strawberry',
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
  } as ExportPlanDetails;

  const summary: DiagnosisSummary = {
    id: 9,
    exportPlanId: 2,
    title: 'تشخيص جديد',
    status: 'مسودة',
    observationDate: '2026-08-05',
    suspectedDisease: null,
    confidencePercentage: null,
    severity: null,
    imageCount: 0,
    finalizedWithOverride: false,
    knowledgeVerified: false,
    createdAt: '2026-08-05T10:00:00Z',
    closedAtUtc: null,
    completedAtUtc: null,
  };

  const detail: DiagnosisDetail = {
    summary,
    readiness: { isReady: false, checklist: [], missingItems: ['صورة'] },
    facts: { affectedPart: null, onset: null, spreadPattern: null, affectedExtent: null, conditions: null, previousTreatments: null },
    recommendedActions: null,
    advisoryWarning: null,
    exportImpact: null,
    failureMessage: null,
    knowledgeFailureMessage: null,
    treatmentProposalId: null,
    messages: [],
    sources: [],
  };

  beforeEach(async () => {
    api = {
      diagnoses: vi.fn(() => of([summary])),
      createDiagnosis: vi.fn(() => of(detail)),
    };
    await TestBed.configureTestingModule({
      imports: [CropHealthPage],
      providers: [
        provideRouter([]),
        { provide: PhaseTwoApi, useValue: api },
        { provide: GreenmindApi, useValue: { exportPlan: vi.fn(() => of(plan)) } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '2' }) } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CropHealthPage);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders the diagnosis history and enables the new diagnosis action for strawberry', () => {
    const button = fixture.nativeElement.querySelector('.new-diagnosis') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.disabled).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('مسودة');
    expect(component.drafts()).toBe(1);
  });

  it('creates a diagnosis and opens its dedicated chat', () => {
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.createDiagnosis();

    expect(api.createDiagnosis).toHaveBeenCalledWith(2);
    expect(navigate).toHaveBeenCalledWith(['/export-plans', 2, 'crop-health', 'diagnoses', 9]);
  });
});
