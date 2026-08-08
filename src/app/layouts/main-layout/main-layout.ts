import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { AuthService } from '@features/auth/services/AuthService';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NotificationCenterService } from '@core/settings/notification-center.service';
import { SupportRealtimeService } from '@core/support/support-realtime.service';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlanDetails } from '@core/api/api.models';
import { PlanContextNavigation } from './plan-context-navigation';
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
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive, RouterOutlet, PlanContextNavigation],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout {
  private readonly auth = inject(AuthService);
  private readonly api = inject(GreenmindApi);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly supportRealtime = inject(SupportRealtimeService);
  public readonly notificationCenter = inject(NotificationCenterService);
  public readonly mobileMenuOpen = signal(false);
  public readonly asideCollapsed = signal(typeof localStorage !== 'undefined' && localStorage.getItem('greenmind.sidebar.collapsed') === 'true');
  public readonly notificationPanelOpen = signal(false);
  public readonly planContext = signal<{ id: number } | null>(null);
  public readonly activePlan = signal<ExportPlanDetails | null>(null);
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
    effect(() => {
      if (typeof localStorage !== 'undefined') localStorage.setItem('greenmind.sidebar.collapsed', String(this.asideCollapsed()));
    });
    this.auth.loadProfile();
    void this.supportRealtime.start();
    this.updatePlanContext(this.router.url);
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => this.updatePlanContext(event.urlAfterRedirects));
  }

  private updatePlanContext(url: string): void {
    const path = url.split(/[?#]/, 1)[0];
    const match = path.match(/^\/export-plans\/(\d+)(?:\/|$)/);
    const id = match ? Number(match[1]) : 0;
    if (!Number.isInteger(id) || id <= 0) {
      this.planContext.set(null);
      this.activePlan.set(null);
      return;
    }

    this.planContext.set({ id });
    if (this.activePlan()?.id === id) return;
    this.activePlan.set(null);
    this.api.exportPlan(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (plan) => {
        if (this.planContext()?.id === id) this.activePlan.set(plan);
      },
    });
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
