import { Component, inject, signal } from '@angular/core';
import { AuthService } from '@features/auth/services/AuthService';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NotificationCenterService } from '@core/settings/notification-center.service';
import { SupportRealtimeService } from '@core/support/support-realtime.service';
import {
  faArrowRightFromBracket,
  faBars,
  faBell,
  faBrain,
  faBriefcase,
  faChevronLeft,
  faClockRotateLeft,
  faFileArrowUp,
  faGear,
  faHeadset,
  faShieldHalved,
  faTableCellsLarge,
  faUsersGear,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-admin-dashboard-layout',
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-dashboard-layout.html',
  styleUrl: './admin-dashboard-layout.css',
})
export class AdminDashboardLayout {
  private readonly auth = inject(AuthService);
  private readonly supportRealtime = inject(SupportRealtimeService);
  public readonly notificationCenter = inject(NotificationCenterService);
  public readonly mobileMenuOpen = signal(false);
  public readonly asideCollapsed = signal(false);
  public readonly notificationPanelOpen = signal(false);
  public readonly icons = {
    accounts: faBriefcase,
    bell: faBell,
    burger: faBars,
    close: faXmark,
    collapse: faChevronLeft,
    dashboard: faTableCellsLarge,
    destinations: faShieldHalved,
    settings: faGear,
    support: faHeadset,
    logout: faArrowRightFromBracket,
    products: faClockRotateLeft,
    regulatoryData: faFileArrowUp,
    knowledgeBase: faBrain,
    team: faUsersGear,
  };

  public constructor() {
    void this.supportRealtime.start();
  }

  public openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }

  public closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  public toggleAside(): void {
    this.asideCollapsed.update((collapsed) => !collapsed);
  }

  public toggleNotifications(): void {
    this.notificationPanelOpen.update((isOpen) => !isOpen);
  }

  public closeNotifications(): void {
    this.notificationPanelOpen.set(false);
  }

  public logout(): void {
    this.auth.logout();
  }
}
