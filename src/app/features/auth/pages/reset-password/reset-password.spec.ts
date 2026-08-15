import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ResetPassword } from './reset-password';
import { AuthService } from '@features/auth/services/AuthService';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  let auth: {
    resetPassword: ReturnType<typeof vi.fn>;
    messageFromError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    auth = {
      resetPassword: vi.fn(() => of(void 0)),
      messageFromError: vi.fn((_, fallback) => fallback),
    };

    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'email' ? 'test@example.com' : key === 'token' ? 'token123' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and detect valid link parameters', () => {
    expect(component).toBeTruthy();
    expect((component as any).invalidLink()).toBe(false);
  });

  it('should compute password requirements and strength', () => {
    (component as any).password = 'weak';
    expect((component as any).passwordStrength().label).toBe('ضعيفة');

    (component as any).password = 'StrongPass1!';
    expect((component as any).passwordStrength().label).toBe('قوية جداً');
    expect((component as any).passwordStrength().percentage).toBe(100);
  });

  it('toggles password visibility correctly', () => {
    expect((component as any).passwordVisible()).toBe(false);
    (component as any).togglePasswordVisibility();
    expect((component as any).passwordVisible()).toBe(true);
    (component as any).togglePasswordVisibility();
    expect((component as any).passwordVisible()).toBe(false);
  });
});
