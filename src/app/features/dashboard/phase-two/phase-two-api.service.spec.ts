import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { vi } from 'vitest';

import { PhaseTwoApi } from './phase-two-api.service';
import { ChatStreamEvent } from './phase-two.models';

describe('PhaseTwoApi chat streaming', () => {
  let api: PhaseTwoApi;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    api = TestBed.inject(PhaseTwoApi);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retries a connection failure with the same idempotency key', async () => {
    const completedEvent: ChatStreamEvent = {
      event: 'completed',
      status: 'مكتمل',
      delta: null,
      messageId: 17,
      content: 'تم الرد',
      retryable: false,
    };
    const payload = new TextEncoder().encode(
      `event: completed\ndata: ${JSON.stringify(completedEvent)}\n\n`,
    );
    const reader = {
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: payload })
        .mockResolvedValueOnce({ done: true, value: undefined }),
    };
    const response = {
      ok: true,
      status: 200,
      body: { getReader: () => reader },
    } as unknown as Response;
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('connection refused'))
      .mockResolvedValueOnce(response);
    vi.stubGlobal('fetch', fetchMock);

    const events: ChatStreamEvent[] = [];
    await api.streamFarmMessage(42, 'اختبار الاتصال', (event) => events.push(event));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    const secondBody = JSON.parse(fetchMock.mock.calls[1][1]?.body as string);
    expect(secondBody.idempotencyKey).toBe(firstBody.idempotencyKey);
    expect(events).toEqual([completedEvent]);
  });

  it('authenticates streaming requests with a non-persistent session token', async () => {
    sessionStorage.setItem('greenmind_access_token', 'session-token');
    const reader = {
      read: vi.fn().mockResolvedValueOnce({ done: true, value: undefined }),
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: { getReader: () => reader },
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    await api.streamFarmMessage(42, 'اختبار المصادقة', () => undefined);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer session-token',
    });
  });
});
