import { Component, inject, signal } from '@angular/core';
import { AuthService } from '@features/auth/services/AuthService';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
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
  public readonly mobileMenuOpen = signal(false);
  public readonly asideCollapsed = signal(false);
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

  public logout(): void { this.auth.logout(); }
}
