import { Component, inject, signal } from '@angular/core';
import { AuthService } from '@features/auth/services/AuthService';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowRightFromBracket,
  faBars,
  faBriefcase,
  faChevronLeft,
  faClockRotateLeft,
  faShieldHalved,
  faTableCellsLarge,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-admin-dashboard-layout',
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-dashboard-layout.html',
  styleUrl: './admin-dashboard-layout.css',
})
export class AdminDashboardLayout {
  private readonly auth = inject(AuthService);
  public readonly mobileMenuOpen = signal(false);
  public readonly asideCollapsed = signal(false);
  public readonly icons = {
    accounts: faBriefcase,
    burger: faBars,
    collapse: faChevronLeft,
    dashboard: faTableCellsLarge,
    destinations: faShieldHalved,
    logout: faArrowRightFromBracket,
    products: faClockRotateLeft,
  };

  public openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  public closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  public toggleAside(): void {
    this.asideCollapsed.update((collapsed) => !collapsed);
  }

  public logout(): void { this.auth.logout(); }
}
