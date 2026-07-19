import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-default-redirect',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultRedirectComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const destination =
      this.authService.currentUser()?.role === 'PlatformAdmin'
        ? '/admin/farms'
        : '/export-plans';

    void this.router.navigateByUrl(destination);
  }
}
