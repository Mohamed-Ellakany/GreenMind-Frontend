import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '@features/auth/services/AuthService';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NotificationCenterService } from '@core/settings/notification-center.service';
import {
  faBars,
  faBell,
  faChartLine,
  faChevronLeft,
  faCircle,
  faCircleQuestion,
  faCircleUser,
  faFileLines,
  faGear,
  faHouse,
  faLeaf,
  faMagnifyingGlass,
  faPlus,
  faRightFromBracket,
  faRobot,
  faSeedling,
  faShieldHalved,
  faShop,
  faTruckFast,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-main-layout',
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  private readonly auth = inject(AuthService);
  public readonly notificationCenter = inject(NotificationCenterService);
  public readonly mobileMenuOpen = signal(false);
  public readonly asideCollapsed = signal(false);
  public readonly notificationPanelOpen = signal(false);
  public readonly profile = this.auth.accountProfile;
  public readonly ownerName = computed(() => this.profile()?.fullName || 'مالك المزرعة');
  public readonly farmName = computed(() => this.profile()?.farmName || 'مزرعتك');
  public readonly ownerInitial = computed(() => this.ownerName().trim().charAt(0) || 'م');
  public readonly icons = {
    activities: faTruckFast,
    ai: faRobot,
    bell: faBell,
    burger: faBars,
    collapse: faChevronLeft,
    circle: faCircle,
    compliance: faShieldHalved,
    dashboard: faHouse,
    disease: faSeedling,
    exportPlans: faShop,
    help: faCircleQuestion,
    leaf: faLeaf,
    logout: faRightFromBracket,
    market: faChartLine,
    plus: faPlus,
    reports: faFileLines,
    search: faMagnifyingGlass,
    seedling: faSeedling,
    settings: faGear,
    user: faCircleUser,
  };

  public constructor() {
    this.auth.loadProfile();
  }

  public toggleMobileMenu(): void {
    this.mobileMenuOpen.update((isOpen) => !isOpen);
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

  public logout(): void { this.auth.logout(); }
}
