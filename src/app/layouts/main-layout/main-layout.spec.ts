import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { NotificationCenterService } from '@core/settings/notification-center.service';
import { SupportRealtimeService } from '@core/support/support-realtime.service';
import { AuthService } from '@features/auth/services/AuthService';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { MainLayout } from './main-layout';

describe('MainLayout styles', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            accountProfile: signal(null),
            loadProfile: vi.fn(),
            logout: vi.fn(),
          },
        },
        { provide: GreenmindApi, useValue: { exportPlan: vi.fn(() => of(null)) } },
        { provide: NotificationCenterService, useValue: { unreadCount: signal(0) } },
        { provide: SupportRealtimeService, useValue: { start: vi.fn(() => Promise.resolve()) } },
      ],
    }).compileComponents();
  });

  it('hides the mobile drawer close button on desktop widths', () => {
    const fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();
    const styles = Array.from(document.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .join('\n');

    expect(styles).toMatch(/@media\s*\(min-width:\s*1024px\)\s*{[\s\S]*?\.mobile-aside-close[^{]*{[\s\S]*?display:\s*none[\s\S]*?}/);
  });
});
