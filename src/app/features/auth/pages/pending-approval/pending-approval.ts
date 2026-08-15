import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/AuthService';

@Component({
  selector: 'app-pending-approval',
  imports: [RouterLink, FormsModule],
  templateUrl: './pending-approval.html',
  styleUrl: './pending-approval.css',
})
export class PendingApproval implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly resending = signal(false);
  protected readonly resendSuccess = signal(false);
  protected readonly resendError = signal<string | null>(null);

  ngOnInit(): void {
    // Try query param or history state
    const queryEmail = this.route.snapshot.queryParamMap.get('email')?.trim();
    const stateEmail = (this.router.getCurrentNavigation()?.extras?.state?.['email'] as string | undefined) ??
      (history.state?.email as string | undefined);

    if (queryEmail) {
      this.email.set(queryEmail);
    } else if (stateEmail) {
      this.email.set(stateEmail);
    }
  }

  protected async onResend(): Promise<void> {
    const targetEmail = this.email().trim();
    if (!targetEmail) {
      this.resendError.set('يرجى كتابة البريد الإلكتروني.');
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
