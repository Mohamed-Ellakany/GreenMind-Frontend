import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './AuthService';

describe('AuthService error handling', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
  });

  it('translates 401 Unauthorized to Arabic credentials error', () => {
    const error = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      error: 'Unauthorized',
    });
    expect(service.messageFromError(error)).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  });

  it('translates 401 wrapped ApiResponse to Arabic credentials error', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: {
        succeeded: false,
        error: {
          code: 'unauthorized',
          message: 'Authentication is required.',
        },
      },
    });
    expect(service.messageFromError(error)).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
  });

  it('translates account_inactive 401 error to activation reminder', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: {
        succeeded: false,
        error: {
          code: 'account_inactive',
          message: 'Account is not activated yet. Please activate your account using the confirmation link sent to your email.',
        },
      },
    });
    expect(service.messageFromError(error)).toBe(
      'الحساب غير مفعّل بعد. يرجى الضغط على رابط التفعيل المرسل إلى بريدك الإلكتروني.',
    );
  });

  it('translates 409 Conflict to duplicate account message', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: {
        succeeded: false,
        error: {
          message: 'Email already in use.',
        },
      },
    });
    expect(service.messageFromError(error)).toBe('يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.');
  });

  it('translates connection failure (status 0) to network error message', () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
    });
    expect(service.messageFromError(error)).toBe(
      'تعذر الاتصال بالخدمة. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.',
    );
  });
});
