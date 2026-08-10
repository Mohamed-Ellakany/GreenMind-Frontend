import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@features/auth/services/AuthService';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './not-found.html',
})
export class NotFound {
  private readonly auth = inject(AuthService);

  public readonly homeUrl = this.auth.isAuthenticated() ? this.auth.homeUrl() : '/';
  public readonly homeLabel = this.auth.isAuthenticated() ? 'العودة إلى لوحة التحكم' : 'العودة إلى الرئيسية';
}
