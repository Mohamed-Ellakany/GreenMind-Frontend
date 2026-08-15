import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { ForgotPassword } from './forgot-password';
import { AuthService } from '@features/auth/services/AuthService';

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;
  let auth: {
    forgotPassword: ReturnType<typeof vi.fn>;
    messageFromError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    auth = {
      forgotPassword: vi.fn(() => of(void 0)),
      messageFromError: vi.fn((_, fallback) => fallback),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('submits valid email and transitions to success state', async () => {
    (component as any).email = 'user@example.com';
    const fakeForm = { invalid: false } as any;

    await (component as any).submit(fakeForm);

    expect(auth.forgotPassword).toHaveBeenCalledWith('user@example.com');
    expect((component as any).success()).toBe(true);
  });
});
