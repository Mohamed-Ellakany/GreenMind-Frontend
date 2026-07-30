import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ToastrService } from 'ngx-toastr';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { KnowledgeBase } from './knowledge-base';

describe('KnowledgeBase', () => {
  let fixture: ComponentFixture<KnowledgeBase>;
  let component: KnowledgeBase;
  const api = {
    ingestQualityStandard: vi.fn(() => of({ chunksIngested: 12 })),
    ingestEuRegulationBody: vi.fn(() => of({ chunksIngested: 8 })),
    ingestEuRegulationAnnex: vi.fn(() => of({ chunksIngested: 4 })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KnowledgeBase],
      providers: [
        { provide: GreenmindApi, useValue: api },
        { provide: ToastrService, useValue: { success: vi.fn(), error: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(KnowledgeBase);
    component = fixture.componentInstance;
    fixture.detectChanges();
    vi.clearAllMocks();
  });

  it('sends the quality-standard fields to the RAG API', () => {
    const file = new File(['%PDF-test'], 'standard.pdf', { type: 'application/pdf' });
    component.sourceName = 'UNECE FFV-35';
    component.crop = 'Strawberry';
    component.selectedFile.set(file);

    component.upload();

    expect(api.ingestQualityStandard).toHaveBeenCalledWith(file, 'Strawberry', 'UNECE FFV-35');
    expect(component.result()).toEqual({ chunksIngested: 12 });
  });

  it('requires annex metadata before enabling ingestion', () => {
    component.selectType('annex');
    component.sourceName = 'EU 2019/2072';
    component.selectedFile.set(new File(['%PDF-test'], 'annex.pdf', { type: 'application/pdf' }));

    expect(component.canSubmit()).toBe(false);

    component.annexLabelHint = 'ANNEX II';
    component.cropKeywordsCsv = 'Fragaria, strawberry';
    expect(component.canSubmit()).toBe(true);
  });
});
