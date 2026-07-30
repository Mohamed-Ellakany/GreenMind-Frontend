import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { Register } from './register';
import { AuthService } from '@features/auth/services/AuthService';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let auth: {
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    register: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  beforeEach(async () => {
    auth = {
      loading: signal(false),
      error: signal(null),
      register: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('redirects to the pending approval page after successful registration', async () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    auth.register.mockReturnValue(of({ userId: '1', email: 'owner@test.com', farmId: '2' }));
    (component as any).registerModel.set({
      fullName: 'Test Owner',
      email: 'owner@test.com',
      password: 'P@ssword123',
      confirmPassword: 'P@ssword123',
      farmName: 'Test Farm',
      terms: true,
    });

    await (component as any).onSubmit();

    expect(navigate).toHaveBeenCalledWith('/auth/pending-approval', { replaceUrl: true });
  });
});
