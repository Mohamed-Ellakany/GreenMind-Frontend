import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
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

type RouteSearchItem = {
  label: string;
  description: string;
  url: string;
  keywords: string;
};

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
  private readonly document = inject(DOCUMENT);
  private readonly supportRealtime = inject(SupportRealtimeService);
  private readonly desktopMedia = this.document.defaultView?.matchMedia?.('(min-width: 1024px)') ?? null;
  private previousBodyOverflow: string | null = null;
  private mobileMenuOpener: HTMLElement | null = null;
  private readonly sidebar = viewChild<ElementRef<HTMLElement>>('sidebar');
  private readonly mobileMenuTrigger = viewChild<ElementRef<HTMLButtonElement>>('mobileMenuTrigger');
  private readonly mobileMenuClose = viewChild<ElementRef<HTMLButtonElement>>('mobileMenuClose');
  private readonly notificationTrigger = viewChild<ElementRef<HTMLButtonElement>>('notificationTrigger');
  private readonly notificationPanel = viewChild<ElementRef<HTMLElement>>('notificationPanel');
  private readonly searchContainer = viewChild<ElementRef<HTMLElement>>('searchContainer');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  public readonly notificationCenter = inject(NotificationCenterService);
  public readonly mobileMenuOpen = signal(false);
  public readonly desktopViewport = signal(this.desktopMedia?.matches ?? true);
  public readonly asideCollapsed = signal(typeof localStorage !== 'undefined' && localStorage.getItem('greenmind.sidebar.collapsed') === 'true');
  public readonly notificationPanelOpen = signal(false);
  public readonly searchQuery = signal('');
  public readonly searchOpen = signal(false);
  public readonly searchActiveIndex = signal(0);
  public readonly planContext = signal<{ id: number } | null>(null);
  public readonly activePlan = signal<ExportPlanDetails | null>(null);
  public readonly profile = this.auth.accountProfile;
  public readonly ownerName = computed(() => this.profile()?.fullName || 'مالك المزرعة');
  public readonly farmName = computed(() => this.profile()?.farmName || 'مزرعتك');
  public readonly ownerInitial = computed(() => this.ownerName().trim().charAt(0) || 'م');
  public readonly mobileDrawerActive = computed(() => !this.desktopViewport() && this.mobileMenuOpen());
  public readonly mobileDrawerHidden = computed(() => !this.desktopViewport() && !this.mobileMenuOpen());
  public readonly notificationButtonLabel = computed(() => {
    const unread = this.notificationCenter.unreadCount();
    return unread ? `الإشعارات، ${unread} غير مقروء` : 'الإشعارات، لا توجد إشعارات غير مقروءة';
  });
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

  private readonly baseSearchItems: RouteSearchItem[] = [
    { label: 'لوحة التحكم', description: 'ملخص المزرعة والموسم', url: '/dashboard', keywords: 'الرئيسية ملخص مزرعة موسم' },
    { label: 'المهام والأنشطة', description: 'المواعيد والتنفيذ اليومي', url: '/activities', keywords: 'مهام نشاط مواعيد تنفيذ يومي' },
    { label: 'الإحصائيات والتقارير', description: 'مؤشرات الأداء والتقدم', url: '/statistics', keywords: 'احصائيات تقارير مؤشرات أداء تقدم' },
    { label: 'خطط التصدير', description: 'إدارة خطط المحاصيل والأسواق', url: '/export-plans', keywords: 'خطة تصدير محصول سوق' },
    { label: 'مقارنة الأسواق', description: 'قارن وجهات وفرص التصدير', url: '/market-comparison', keywords: 'اسواق وجهات مقارنة فرص' },
    { label: 'المستشار الذكي', description: 'اسأل مساعد جرين مايند', url: '/ai-agent', keywords: 'ذكاء اصطناعي مساعد مستشار سؤال' },
    { label: 'إعدادات الحساب', description: 'بياناتك وبيانات المزرعة', url: '/account-settings', keywords: 'حساب ملف شخصي بيانات مزرعة' },
    { label: 'مركز المساعدة', description: 'تواصل مع فريق الدعم', url: '/support', keywords: 'مساعدة دعم تواصل مشكلة' },
  ];

  public readonly routeSearchItems = computed<RouteSearchItem[]>(() => {
    const context = this.planContext();
    if (!context) return this.baseSearchItems;
    const prefix = `/export-plans/${context.id}`;
    const planName = this.activePlan()?.name || 'الخطة الحالية';
    return [
      { label: `لوحة متابعة ${planName}`, description: 'التقدم والمهام ومؤشرات الموسم', url: `${prefix}/overview`, keywords: 'خطة حالية متابعة تقدم مهام موسم' },
      { label: 'مستشار الخطة الذكي', description: 'محادثة مرتبطة بالخطة الحالية', url: `${prefix}/agricultural-advisor`, keywords: 'خطة مستشار محادثة سؤال ذكاء' },
      { label: 'صحة المحصول', description: 'التشخيص والصور والتحليلات', url: `${prefix}/crop-health`, keywords: 'صحة محصول تشخيص صور مرض' },
      { label: 'متابعة التربة', description: 'الإحصائيات والقراءات وسجل القياسات', url: `${prefix}/soil-monitoring`, keywords: 'تربة قياسات حموضة رطوبة ملوحة قراءات' },
      { label: 'الميزانية والمصروفات', description: 'التكاليف والإيصالات والفواتير', url: `${prefix}/budget-expenses`, keywords: 'ميزانية تكلفة مصروف إيصال فاتورة' },
      ...this.baseSearchItems,
    ];
  });

  public readonly searchResults = computed(() => {
    const query = this.normalizeSearch(this.searchQuery());
    const items = this.routeSearchItems();
    if (!query) return items.slice(0, 6);
    return items
      .filter((item) => this.normalizeSearch(`${item.label} ${item.description} ${item.keywords}`).includes(query))
      .slice(0, 6);
  });

  public readonly searchActiveDescendant = computed(() => {
    const results = this.searchResults();
    if (!this.searchOpen() || !results.length) return null;
    return `farmer-route-result-${Math.min(this.searchActiveIndex(), results.length - 1)}`;
  });

  public constructor() {
    effect(() => {
      if (typeof localStorage !== 'undefined') localStorage.setItem('greenmind.sidebar.collapsed', String(this.asideCollapsed()));
    });
    effect(() => this.setBodyScrollLocked(this.mobileDrawerActive()));
    const onViewportChange = (event: MediaQueryListEvent): void => {
      this.desktopViewport.set(event.matches);
      if (event.matches) this.mobileMenuOpen.set(false);
    };
    this.desktopMedia?.addEventListener('change', onViewportChange);
    this.destroyRef.onDestroy(() => {
      this.desktopMedia?.removeEventListener('change', onViewportChange);
      this.setBodyScrollLocked(false);
    });
    this.auth.loadProfile();
    void this.supportRealtime.start().catch(() => undefined);
    this.updatePlanContext(this.router.url);
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((event) => {
      this.updatePlanContext(event.urlAfterRedirects);
      this.mobileMenuOpen.set(false);
      this.notificationPanelOpen.set(false);
      this.closeSearch();
    });
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
    const activeElement = this.document.activeElement as HTMLElement | null;
    this.mobileMenuOpener = typeof activeElement?.focus === 'function' ? activeElement : null;
    this.mobileMenuOpen.set(true);
    queueMicrotask(() => this.mobileMenuClose()?.nativeElement.focus());
  }

  public closeMobileMenu(restoreFocus = true): void {
    this.mobileMenuOpen.set(false);
    const opener = this.mobileMenuOpener ?? this.mobileMenuTrigger()?.nativeElement;
    this.mobileMenuOpener = null;
    if (restoreFocus) queueMicrotask(() => opener?.focus());
  }

  public toggleAside(): void {
    this.asideCollapsed.update((collapsed) => !collapsed);
  }

  public toggleNotifications(): void {
    const willOpen = !this.notificationPanelOpen();
    this.notificationPanelOpen.set(willOpen);
    if (willOpen) queueMicrotask(() => this.notificationPanel()?.nativeElement.focus());
  }

  public closeNotifications(restoreFocus = false): void {
    this.notificationPanelOpen.set(false);
    if (restoreFocus) queueMicrotask(() => this.notificationTrigger()?.nativeElement.focus());
  }

  public openSearch(): void {
    this.searchOpen.set(true);
    this.searchActiveIndex.set(0);
  }

  public closeSearch(clearQuery = false): void {
    this.searchOpen.set(false);
    this.searchActiveIndex.set(0);
    if (clearQuery) this.searchQuery.set('');
  }

  public updateSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.searchOpen.set(true);
    this.searchActiveIndex.set(0);
  }

  public handleSearchFocusOut(): void {
    queueMicrotask(() => {
      const container = this.searchContainer()?.nativeElement;
      if (container && !container.contains(this.document.activeElement)) this.closeSearch();
    });
  }

  public handleSearchKeydown(event: KeyboardEvent): void {
    const results = this.searchResults();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeSearch();
      return;
    }
    if (!results.length) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      this.searchActiveIndex.update((index) => (index + step + results.length) % results.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      void this.navigateToSearchResult(results[Math.min(this.searchActiveIndex(), results.length - 1)]);
    }
  }

  public async navigateToSearchResult(item: RouteSearchItem): Promise<void> {
    this.closeSearch(true);
    await this.router.navigateByUrl(item.url);
  }

  public searchResultId(index: number): string {
    return `farmer-route-result-${index}`;
  }

  @HostListener('document:keydown', ['$event'])
  public handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && this.mobileDrawerActive()) {
      this.trapFocus(event, this.sidebar()?.nativeElement);
      return;
    }
    if (event.key !== 'Escape') return;
    if (this.mobileDrawerActive()) {
      event.preventDefault();
      this.closeMobileMenu(true);
    } else if (this.notificationPanelOpen()) {
      event.preventDefault();
      this.closeNotifications(true);
    } else if (this.searchOpen()) {
      event.preventDefault();
      this.closeSearch();
      queueMicrotask(() => this.searchInput()?.nativeElement.focus());
    }
  }

  @HostListener('document:click', ['$event'])
  public handleDocumentClick(event: MouseEvent): void {
    const path = event.composedPath();
    const notificationTrigger = this.notificationTrigger()?.nativeElement;
    const notificationPanel = this.notificationPanel()?.nativeElement;
    if (
      this.notificationPanelOpen()
      && (!notificationTrigger || !path.includes(notificationTrigger))
      && (!notificationPanel || !path.includes(notificationPanel))
    ) {
      this.closeNotifications();
    }
    const searchContainer = this.searchContainer()?.nativeElement;
    if (this.searchOpen() && (!searchContainer || !path.includes(searchContainer))) {
      this.closeSearch();
    }
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFKD')
      .replace(/[\u0640\u064b-\u065f\u0670]/g, '')
      .trim()
      .toLocaleLowerCase('ar-EG');
  }

  private setBodyScrollLocked(locked: boolean): void {
    const body = this.document.body;
    if (locked && this.previousBodyOverflow === null) {
      this.previousBodyOverflow = body.style.overflow;
      body.style.overflow = 'hidden';
    } else if (!locked && this.previousBodyOverflow !== null) {
      body.style.overflow = this.previousBodyOverflow;
      this.previousBodyOverflow = null;
    }
  }

  private trapFocus(event: KeyboardEvent, container?: HTMLElement): void {
    if (!container) return;
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.getAttribute('aria-hidden') !== 'true');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;
    if (!container.contains(active)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  public logout(): void { this.auth.logout(); }
}
