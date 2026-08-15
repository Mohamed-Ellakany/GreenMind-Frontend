import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/AuthService';

@Component({
  selector: 'app-activate-account',
  imports: [RouterLink, FormsModule],
  templateUrl: './activate-account.html',
  styleUrl: './activate-account.css',
})
export class ActivateAccount implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly status = signal<'loading' | 'success' | 'invalid' | 'error'>('loading');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly email = signal('');
  protected readonly token = signal('');

  protected readonly resending = signal(false);
  protected readonly resendSuccess = signal(false);
  protected readonly resendError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const emailParam = this.route.snapshot.queryParamMap.get('email')?.trim() ?? '';
    const tokenParam = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

    this.email.set(emailParam);
    this.token.set(tokenParam);

    if (!emailParam || !tokenParam) {
      this.status.set('invalid');
      this.errorMessage.set('رابط التفعيل غير مكتمل أو غير صالح.');
      return;
    }

    await this.performActivation(emailParam, tokenParam);
  }

  protected async performActivation(email: string, token: string): Promise<void> {
    this.status.set('loading');
    this.errorMessage.set(null);

    try {
      await firstValueFrom(this.authService.activateAccount({ email, token }));
      this.status.set('success');
    } catch (error) {
      const msg = this.authService.messageFromError(
        error,
        'تعذر تفعيل الحساب. قد يكون الرابط غير صالح أو انتهت صلاحيته.',
      );
      this.errorMessage.set(msg);
      this.status.set('invalid');
    }
  }

  protected async onResendActivation(): Promise<void> {
    const targetEmail = this.email().trim();
    if (!targetEmail) {
      this.resendError.set('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    this.resending.set(true);
    this.resendSuccess.set(false);
    this.resendError.set(null);

    try {
      await firstValueFrom(this.authService.resendActivation({ email: targetEmail }));
      this.resendSuccess.set(true);
    } catch (error) {
      const msg = this.authService.messageFromError(
        error,
        'تعذر إرسال رابط التفعيل الآن. يرجى المحاولة لاحقاً.',
      );
      this.resendError.set(msg);
    } finally {
      this.resending.set(false);
    }
  }
}
