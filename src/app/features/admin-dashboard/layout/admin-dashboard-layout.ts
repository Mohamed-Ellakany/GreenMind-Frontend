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
import {
  faArrowRightFromBracket,
  faBars,
  faBell,
  faBrain,
  faBriefcase,
  faChartLine,
  faChevronRight,
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
  public readonly notificationCenter = inject(NotificationCenterService);
  public readonly mobileMenuOpen = signal(false);
  public readonly desktopViewport = signal(this.desktopMedia?.matches ?? true);
  public readonly asideCollapsed = signal(typeof localStorage !== 'undefined' && localStorage.getItem('greenmind.admin.sidebar.collapsed') === 'true');
  public readonly notificationPanelOpen = signal(false);
  public readonly profile = this.auth.accountProfile;
  public readonly adminName = computed(() => this.profile()?.fullName || 'مدير المنصة');
  public readonly adminEmail = computed(() => this.profile()?.email || 'صلاحية إدارة كاملة');
  public readonly adminInitial = computed(() => this.adminName().trim().charAt(0) || 'م');
  public readonly mobileDrawerActive = computed(() => !this.desktopViewport() && this.mobileMenuOpen());
  public readonly mobileDrawerHidden = computed(() => !this.desktopViewport() && !this.mobileMenuOpen());
  public readonly notificationButtonLabel = computed(() => {
    const unread = this.notificationCenter.unreadCount();
    return unread ? `إشعارات الدعم، ${unread} غير مقروء` : 'إشعارات الدعم، لا توجد رسائل غير مقروءة';
  });
  public readonly icons = {
    accounts: faBriefcase,
    aiUsage: faChartLine,
    bell: faBell,
    burger: faBars,
    close: faXmark,
    collapse: faChevronRight,
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
    effect(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('greenmind.admin.sidebar.collapsed', String(this.asideCollapsed()));
      }
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
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.mobileMenuOpen.set(false);
      this.notificationPanelOpen.set(false);
    });
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

  public logout(): void {
    this.auth.logout();
  }
}
