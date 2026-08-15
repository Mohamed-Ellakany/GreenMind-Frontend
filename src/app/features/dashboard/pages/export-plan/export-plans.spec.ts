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

  it('navigates through 4 steps: plan details -> location -> farm data -> schedule analysis', () => {
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

    // Step 2 -> Step 3 (Farm Data)
    component.nextStep();
    expect(component.formStep()).toBe(3);

    // Enter farm data & soil/water measurements
    component.form.farmType = 'أرض مفتوحة';
    component.form.soilType = 'رملية';
    component.form.irrigationSystem = 'تنقيط';
    component.form.fertigation = 'نعم';
    component.form.soilPh = 6.8;
    component.form.soilEc = 1.2;
    component.form.soilNitrogen = 40;
    component.form.soilPhosphorus = 20;
    component.form.soilPotassium = 200;
    component.form.soilOrganicMatter = 2.0;

    expect(component.isSoilAnalysisCompleted()).toBe(true);
    expect(component.isWaterAnalysisCompleted()).toBe(false);

    component.form.waterPh = 7.1;
    component.form.waterEc = 0.8;
    component.form.waterSalinity = 500;
    component.form.waterSodium = 25;
    component.form.waterChloride = 30;
    component.form.waterBicarbonate = 120;
    component.form.waterCalcium = 40;
    component.form.waterMagnesium = 15;
    component.form.waterSar = 1.2;

    expect(component.isWaterAnalysisCompleted()).toBe(true);
    expect(component.isFarmDataReady()).toBe(true);

    // Step 3 -> Step 4 (Schedule Analysis)
    component.nextStep();

    expect(api.analyzeExportPlanSchedule).toHaveBeenCalledWith(expect.objectContaining({
      latitude: 29.912345,
      longitude: 30.923456,
      city: district.name,
    }));
    expect(component.formStep()).toBe(4);
    expect(component.form.analysisToken).toBe('signed-token');

    component.form.plantingDate = '2026-09-02';
    component.markDatesChanged();
    expect(component.scheduleDirty()).toBe(true);
    expect(component.form.analysisToken).toBe('');
  });

  it('requires farmType and irrigationSystem on step 3, but measurements remain optional', () => {
    const fixture = TestBed.createComponent(ExportPlans);
    const component = fixture.componentInstance;
    component.openForm();
    component.form.name = 'Test Plan';
    component.form.cropId = 1;
    component.form.destinationId = 1;
    const governorate = component.governorates[0];
    component.form.governorate = governorate.name;
    const district = component.availableDistricts()[0];
    component.form.city = district.name;
    component.form.latitude = 30.0;
    component.form.longitude = 31.0;
    component.mapLocationSelected.set(true);

    // Navigate to step 3
    component.formStep.set(3);

    // Case 1: Missing farmType -> validation fails
    component.form.farmType = '';
    component.form.irrigationSystem = 'تنقيط';
    component.nextStep();
    expect(component.formStep()).toBe(3);
    expect(component.stepError()).toBe('يرجى تحديد نوع المزرعة للمتابعة.');

    // Case 2: Missing irrigationSystem -> validation fails
    component.form.farmType = 'أرض مفتوحة';
    component.form.irrigationSystem = '';
    component.nextStep();
    expect(component.formStep()).toBe(3);
    expect(component.stepError()).toBe('يرجى تحديد نوع أو نظام الري للمتابعة.');

    // Case 3: farmType and irrigationSystem provided, but ALL measurements empty -> succeeds to step 4
    component.form.farmType = 'أرض مفتوحة';
    component.form.irrigationSystem = 'تنقيط';
    component.form.soilPh = null;
    component.form.soilEc = null;
    component.form.soilNitrogen = null;
    component.form.waterPh = null;
    component.form.waterEc = null;

    component.nextStep();
    expect(component.stepError()).toBeNull();
    expect(api.analyzeExportPlanSchedule).toHaveBeenCalled();
    expect(component.formStep()).toBe(4);
  });
});

