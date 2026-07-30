import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ApiClient } from './api-client.service';
import { GreenmindApi } from './greenmind-api.service';

describe('GreenmindApi RAG ingestion', () => {
  const client = { post: vi.fn(() => of({ chunksIngested: 3 })) };
  let api: GreenmindApi;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [GreenmindApi, { provide: ApiClient, useValue: client }] });
    api = TestBed.inject(GreenmindApi);
    vi.clearAllMocks();
  });

  it('builds the quality-standard multipart request expected by the endpoint', () => {
    const file = new File(['%PDF'], 'quality.pdf', { type: 'application/pdf' });
    api.ingestQualityStandard(file, 'Strawberry', 'UNECE FFV-35').subscribe();

    const [path, body] = client.post.mock.calls[0] as unknown as [string, FormData];
    expect(path).toBe('/api/admin/rag/ingest/quality-standard');
    expect((body.get('File') as File).name).toBe('quality.pdf');
    expect(body.get('Crop')).toBe('Strawberry');
    expect(body.get('SourceName')).toBe('UNECE FFV-35');
  });

  it('builds the regulation-body and annex multipart requests', () => {
    const file = new File(['%PDF'], 'regulation.pdf', { type: 'application/pdf' });
    api.ingestEuRegulationBody(file, 'EU 2019/2072').subscribe();
    api.ingestEuRegulationAnnex(file, 'EU 2019/2072', 'ANNEX II', 'Fragaria, strawberry').subscribe();

    const [bodyPath, bodyForm] = client.post.mock.calls[0] as unknown as [string, FormData];
    const [annexPath, annexForm] = client.post.mock.calls[1] as unknown as [string, FormData];
    expect(bodyPath).toBe('/api/admin/rag/ingest/eu-regulation-body');
    expect(bodyForm.get('SourceName')).toBe('EU 2019/2072');
    expect(annexPath).toBe('/api/admin/rag/ingest/eu-regulation-annex');
    expect(annexForm.get('AnnexLabelHint')).toBe('ANNEX II');
    expect(annexForm.get('CropKeywordsCsv')).toBe('Fragaria, strawberry');
  });
});
