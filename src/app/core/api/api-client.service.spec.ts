import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiClient } from './api-client.service';

describe('ApiClient', () => {
  let api: ApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiClient, provideHttpClient(), provideHttpClientTesting()],
    });

    api = TestBed.inject(ApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('treats a 204 response as a successful void result', () => {
    let completed = false;
    let failed = false;

    api.patch<void>('/api/Tasks/1', { status: 'Completed' }).subscribe({
      complete: () => { completed = true; },
      error: () => { failed = true; },
    });

    http.expectOne('/api/Tasks/1').flush(null, { status: 204, statusText: 'No Content' });

    expect(completed).toBe(true);
    expect(failed).toBe(false);
  });
});
