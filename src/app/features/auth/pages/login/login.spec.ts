import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { throwError } from 'rxjs';
import { vi } from 'vitest';

import { Login } from './login';
import { AuthService } from '@features/auth/services/AuthService';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let auth: {
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    errorCode: ReturnType<typeof signal<string | null>>;
    login: ReturnType<typeof vi.fn>;
    homeUrl: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(async () => {
    auth = {
      loading: signal(false),
      error: signal(null),
      errorCode: signal(null),
      login: vi.fn(),
      homeUrl: vi.fn(() => '/dashboard'),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('prevents the browser native GET submission', () => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const event = new SubmitEvent('submit', { bubbles: true, cancelable: true });

    form.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('redirects pending approval login failures to the waiting page', async () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    auth.errorCode.set('account_pending_approval');
    auth.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    (component as any).loginModel.set({ email: 'owner@test.com', password: 'P@ssword123', rememberMe: false });

    await (component as any).onSubmit(new SubmitEvent('submit', { cancelable: true }));

    expect(navigate).toHaveBeenCalledWith('/auth/pending-approval', { replaceUrl: true });
  });

  it('keeps non-pending login failures on the login page', async () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    auth.errorCode.set('account_inactive');
    auth.login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    (component as any).loginModel.set({ email: 'owner@test.com', password: 'P@ssword123', rememberMe: false });

    await (component as any).onSubmit(new SubmitEvent('submit', { cancelable: true }));

    expect(navigate).not.toHaveBeenCalled();
  });
});
