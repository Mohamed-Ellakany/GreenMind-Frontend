import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-farm-owner-layout',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './farm-owner-layout.component.html',
  styleUrl: './farm-owner-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FarmOwnerLayoutComponent {
  readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout().subscribe();
  }
}
