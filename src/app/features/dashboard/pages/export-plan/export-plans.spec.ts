import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlanScheduleAnalysis } from '@core/api/api.models';
import { ExportPlans } from './export-plans';

describe('ExportPlans wizard', () => {
  const analysis: ExportPlanScheduleAnalysis = {
    seasonName: 'Winter season',
    plantingDate: '2026-09-01',
    expectedHarvestDate: '2026-12-01',
    expectedExportDate: '2026-12-08',
    assessment: 'Feasible',
    confidence: 'Medium',
    summary: 'Suggested dates based on the coordinates.',
    reasons: ['Climate suitability'], warnings: [], recommendations: [], assumptions: [],
    sources: [{
      id: 'nasa', title: 'NASA POWER', publisher: 'NASA', url: 'https://power.larc.nasa.gov/',
      retrievedAtUtc: '2026-08-03T00:00:00Z', evidenceKind: 'OfficialSource', supportedFacts: ['Climate'],
    }],
    inferredFacts: [],
    analysisToken: 'signed-token',
  };

  const api = {
    exportPlans: vi.fn(() => of([])),
    crops: vi.fn(() => of([{ id: 1, name: 'Strawberry' }])),
    destinations: vi.fn(() => of([{ id: 1, name: 'Germany' }])),
    analyzeExportPlanSchedule: vi.fn(() => of(analysis)),
    createExportPlan: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [ExportPlans],
      providers: [provideRouter([]), { provide: GreenmindApi, useValue: api }],
    });
  });

  it('keeps navigation actions in a dedicated footer', () => {
    const fixture = TestBed.createComponent(ExportPlans);
    fixture.componentInstance.openForm();
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector('.export-plan-modal__dialog') as HTMLFormElement;
    const body = dialog.querySelector('.export-plan-modal__body') as HTMLElement;
    const footer = dialog.querySelector('.export-plan-modal__footer') as HTMLElement;
    expect(dialog).toBeTruthy();
    expect(body).toBeTruthy();
    expect(footer).toBeTruthy();
    expect(body.nextElementSibling).toBe(footer);
    expect(footer.querySelectorAll('button').length).toBeGreaterThanOrEqual(2);
  });

  it('analyzes from the saved coordinates and invalidates edited dates', () => {
    const fixture = TestBed.createComponent(ExportPlans);
    const component = fixture.componentInstance;
    component.openForm();
    component.form.name = 'Coordinate-bound plan';
    component.form.cropId = 1;
    component.form.destinationId = 1;
    const governorate = component.governorates[0];
    component.form.governorate = governorate.name;
    const district = component.availableDistricts()[0];
    component.form.city = district.name;
    component.form.latitude = 29.912345;
    component.form.longitude = 30.923456;
    component.mapLocationSelected.set(true);
    component.formStep.set(2);

    component.nextStep();

    expect(api.analyzeExportPlanSchedule).toHaveBeenCalledWith(expect.objectContaining({
      latitude: 29.912345,
      longitude: 30.923456,
      city: district.name,
    }));
    expect(component.formStep()).toBe(3);
    expect(component.form.analysisToken).toBe('signed-token');

    component.form.plantingDate = '2026-09-02';
    component.markDatesChanged();
    expect(component.scheduleDirty()).toBe(true);
    expect(component.form.analysisToken).toBe('');
  });
});
