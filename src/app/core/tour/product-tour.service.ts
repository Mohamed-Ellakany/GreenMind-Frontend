import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  faCircleQuestion,
  faFileLines,
  faGear,
  faHouse,
  faRobot,
  faShop,
  faTruckFast,
} from '@fortawesome/free-solid-svg-icons';
import { PopoverPosition, TargetRect, TourPlacement, TourStep } from './product-tour.model';

@Injectable({ providedIn: 'root' })
export class ProductTourService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  private readonly storagePrefix = 'greenmind_tour_completed_';
  private currentUserId: string = 'guest';

  public readonly steps: TourStep[] = [
    {
      id: 'dashboard',
      targetSelector: '[data-tour="dashboard"]',
      targetSelectorMobile: '[data-tour="dashboard-header"]',
      title: 'لوحة التحكم والمؤشرات الحية',
      badge: 'نظرة عامة',
      icon: faHouse,
      iconEmoji: '📊',
      description:
        'نقطة انطلاقك اليومية! تمنحك لوحة التحكم ملخصاً فورياً عن جاهزية التصدير، تنبيهات الطقس الاستباقية، ومؤشرات الإنجاز لجميع محاصيل مزرعتك.',
      tip: 'تُحدّث المؤشرات تلقائياً فور تسجيل المهام والقراءات الحقلية.',
      placement: 'bottom',
      route: '/dashboard',
      highlightPadding: 8,
    },
    {
      id: 'activities',
      targetSelector: '[data-tour="activities"]',
      targetSelectorMobile: '[data-tour-mobile="activities"]',
      title: 'المهام والأنشطة الزراعية',
      badge: 'التنفيذ والمتابعة',
      icon: faTruckFast,
      iconEmoji: '📅',
      description:
        'جدول عمليات يومي ينظم مواعيد الري، التسميد، الفحص، والوقاية الحقلية خطوة بخطوة مع توثيق السجلات.',
      tip: 'تسجيل إنجاز المهام يرفع مباشرة نسبة جاهزية المحصول للتصدير.',
      placement: 'left',
      route: '/dashboard',
      highlightPadding: 8,
    },
    {
      id: 'statistics',
      targetSelector: '[data-tour="statistics"]',
      targetSelectorMobile: '[data-tour-mobile="more"]',
      title: 'الإحصائيات والتقارير',
      badge: 'تحليل الأداء',
      icon: faFileLines,
      iconEmoji: '📈',
      description:
        'لوحات تحليلية دقيقة تتابع حجم الإنتاجية، التكاليف والمصروفات، ومؤشرات الامتثال لمعايير الجودة والتصدير.',
      tip: 'يمكنك استخراج تقارير تفصيلية جاهزة للجهات التفتيشية والرقابية.',
      mobileTip: 'تجد الإحصائيات والتقارير داخل قائمة "المزيد" أو عبر بطاقات لوحة التحكم.',
      placement: 'left',
      route: '/dashboard',
      highlightPadding: 8,
    },
    {
      id: 'export-plans',
      targetSelector: '[data-tour="export-plans"]',
      targetSelectorMobile: '[data-tour-mobile="export-plans"]',
      title: 'خطط التصدير الذكية',
      badge: 'المحاصيل والأسواق',
      icon: faShop,
      iconEmoji: '🌱',
      description:
        'قلب منصة جرين مايند! هنا تنشئ وتتابع خطط التصدير المتوافقة مع معايير الأسواق الدولية، مع جداول التسميد والمكافحة وفترات الأمان (PHI).',
      tip: 'يدعم النظام معايير الاتحاد الأوروبي والخليج ومتبقيات المبيدات (MRL).',
      placement: 'left',
      route: '/dashboard',
      highlightPadding: 8,
    },
    {
      id: 'ai-agent',
      targetSelector: '[data-tour="ai-agent"]',
      targetSelectorMobile: '[data-tour-mobile="ai-agent"]',
      title: 'المستشار الزراعي الذكي',
      badge: 'ذكاء اصطناعي 24/7',
      icon: faRobot,
      iconEmoji: '🤖',
      description:
        'خبيرك الزراعي الخاص المتاح على مدار الساعة! اسأله عن تشخيص الآفات والأمراض، فترات أمان المبيدات، أو خطط التسميد التخصصية.',
      tip: 'مدعوم بقواعد بيانات زراعية وتنظيمية معتمدة ومحدثة باستمرار.',
      placement: 'left',
      route: '/dashboard',
      highlightPadding: 8,
    },
    {
      id: 'account-settings',
      targetSelector: '[data-tour="account-settings"]',
      targetSelectorMobile: '[data-tour-mobile="more"]',
      title: 'إعدادات الحساب والمزرعة',
      badge: 'الملف والتخصيص',
      icon: faGear,
      iconEmoji: '⚙️',
      description:
        'إدارة بيانات المزرعة، المساحة، المواقع الجغرافية، الملف الشخصي، وتفضيلات الإشعارات والأمان.',
      tip: 'تأكد من اكتمال بيانات المزرعة لتوليد خطط تصدير بدقة أعلى.',
      mobileTip: 'يمكنك الوصول لإعدادات الحساب والمزرعة في أي وقت عبر قائمة "المزيد".',
      placement: 'left',
      route: '/dashboard',
      highlightPadding: 8,
    },
    {
      id: 'support-center',
      targetSelector: '[data-tour="support"]',
      targetSelectorMobile: '[data-tour-mobile="more"]',
      title: 'مركز المساعدة وإعادة الجولة',
      badge: 'الدعم والمساعدة',
      icon: faCircleQuestion,
      iconEmoji: '💬',
      description:
        'فريق الدعم الفني والزراعي في خدمتك دائماً عبر الشات المباشر. كما يمكنك إعادة تشغيل هذه الجولة التعريفية في أي وقت بنقرة واحدة من هنا.',
      tip: 'يمكنك أيضاً استخدام شريط البحث السريع أعلى المنصة للتنقل الفوري.',
      mobileTip: 'مركز المساعدة وإعادة تشغيل الجولة متوفران دائماً في قائمة "المزيد".',
      placement: 'left',
      route: '/dashboard',
      highlightPadding: 8,
    },
  ];

  public readonly isActive = signal(false);
  public readonly isWelcomeOpen = signal(false);
  public readonly isCompletedOpen = signal(false);
  public readonly currentStepIndex = signal(0);
  public readonly targetRect = signal<TargetRect | null>(null);
  public readonly popoverPos = signal<PopoverPosition | null>(null);
  public readonly windowDimensions = signal<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  public readonly totalSteps = computed(() => this.steps.length);
  public readonly isMobile = computed(() => this.windowDimensions().width < 1024);
  public readonly currentStep = computed<TourStep | null>(() => {
    const idx = this.currentStepIndex();
    return this.steps[idx] ?? null;
  });
  public readonly isFirstStep = computed(() => this.currentStepIndex() === 0);
  public readonly isLastStep = computed(() => this.currentStepIndex() === this.steps.length - 1);
  public readonly progressPercentage = computed(() => {
    const total = this.steps.length;
    if (total === 0) return 0;
    return Math.round(((this.currentStepIndex() + 1) / total) * 100);
  });

  public constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.handleViewportChange(), { passive: true });
      window.addEventListener('scroll', () => this.handleViewportChange(), { passive: true, capture: true });
    }
  }

  public setUserId(userId?: string | number | null): void {
    if (userId) {
      this.currentUserId = String(userId);
    }
  }

  public checkAndAutoStart(userId?: string | number | null): void {
    if (userId) {
      this.setUserId(userId);
    }

    if (typeof localStorage === 'undefined') return;

    const storageKey = this.getStorageKey();
    const hasSeen = localStorage.getItem(storageKey);

    if (!hasSeen) {
      setTimeout(() => {
        if (!this.isActive() && !this.isCompletedOpen()) {
          this.isWelcomeOpen.set(true);
        }
      }, 750);
    }
  }

  public startTour(): void {
    this.isWelcomeOpen.set(false);
    this.isCompletedOpen.set(false);
    this.currentStepIndex.set(0);
    this.isActive.set(true);

    this.navigateToStep(0);
  }

  public nextStep(): void {
    const nextIdx = this.currentStepIndex() + 1;
    if (nextIdx < this.steps.length) {
      this.currentStepIndex.set(nextIdx);
      this.navigateToStep(nextIdx);
    } else {
      this.completeTour();
    }
  }

  public prevStep(): void {
    const prevIdx = this.currentStepIndex() - 1;
    if (prevIdx >= 0) {
      this.currentStepIndex.set(prevIdx);
      this.navigateToStep(prevIdx);
    }
  }

  public goToStep(index: number): void {
    if (index >= 0 && index < this.steps.length) {
      this.currentStepIndex.set(index);
      this.navigateToStep(index);
    }
  }

  public skipTour(): void {
    this.isActive.set(false);
    this.isWelcomeOpen.set(false);
    this.isCompletedOpen.set(false);
    this.markTourAsCompleted();
  }

  public completeTour(): void {
    this.isActive.set(false);
    this.isWelcomeOpen.set(false);
    this.isCompletedOpen.set(true);
    this.markTourAsCompleted();
  }

  public resetAndStartTour(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.getStorageKey());
      localStorage.removeItem('greenmind_tour_completed_guest');
    }
    this.startTour();
  }

  public closeAll(): void {
    this.isActive.set(false);
    this.isWelcomeOpen.set(false);
    this.isCompletedOpen.set(false);
  }

  public handleViewportChange(): void {
    if (typeof window !== 'undefined') {
      this.windowDimensions.set({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    if (this.isActive()) {
      this.recalculateTargetPosition();
    }
  }

  public recalculateTargetPosition(): void {
    const step = this.currentStep();
    if (!step) return;

    const el = this.getTargetElement(step);
    if (!el) {
      this.targetRect.set(null);
      this.popoverPos.set(this.getCenterFallbackPosition());
      return;
    }

    const rect = el.getBoundingClientRect();
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isMobileView = winWidth < 1024;
    const padding = isMobileView ? Math.min(step.highlightPadding ?? 5, 5) : (step.highlightPadding ?? 8);

    const rawTop = rect.top - padding;
    const rawLeft = rect.left - padding;
    const rawRight = rect.right + padding;
    const rawBottom = rect.bottom + padding;

    const top = Math.max(2, rawTop);
    const left = Math.max(2, rawLeft);
    const right = Math.min(winWidth - 2, rawRight);
    const bottom = Math.min(winHeight - 2, rawBottom);

    const targetRect: TargetRect = {
      top,
      left,
      width: Math.max(24, right - left),
      height: Math.max(24, bottom - top),
      bottom,
      right,
    };

    this.targetRect.set(targetRect);
    this.popoverPos.set(this.computePopoverPosition(targetRect, step.placement || 'auto'));
  }

  private getTargetElement(step: TourStep): HTMLElement | null {
    const isMobileView = typeof window !== 'undefined' && window.innerWidth < 1024;

    // On mobile, prioritize targetSelectorMobile if available
    if (isMobileView && step.targetSelectorMobile) {
      const mobileEl = this.document.querySelector(step.targetSelectorMobile) as HTMLElement | null;
      if (mobileEl && this.isElementVisible(mobileEl)) {
        return mobileEl;
      }
    }

    // Try primary targetSelector
    const primaryEl = this.document.querySelector(step.targetSelector) as HTMLElement | null;
    if (primaryEl && this.isElementVisible(primaryEl)) {
      return primaryEl;
    }

    // Secondary fallback for mobile if primary was queried first
    if (step.targetSelectorMobile) {
      const mobileEl = this.document.querySelector(step.targetSelectorMobile) as HTMLElement | null;
      if (mobileEl && this.isElementVisible(mobileEl)) {
        return mobileEl;
      }
    }

    return null;
  }

  private isElementVisible(el: HTMLElement | null): boolean {
    if (!el) return false;
    if (typeof window === 'undefined') return true;

    const style = window.getComputedStyle(el);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      parseFloat(style.opacity || '1') === 0
    ) {
      return false;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    // Check if positioned completely outside viewport horizontally
    if (rect.right <= 0 || rect.left >= window.innerWidth) {
      return false;
    }

    return true;
  }

  private navigateToStep(index: number): void {
    const step = this.steps[index];
    if (!step) return;

    if (step.route && !this.router.url.startsWith(step.route)) {
      void this.router.navigateByUrl(step.route).then(() => {
        setTimeout(() => this.locateTargetWithScroll(step), 350);
      });
      return;
    }

    setTimeout(() => this.locateTargetWithScroll(step), 80);
  }

  private locateTargetWithScroll(step: TourStep): void {
    const el = this.getTargetElement(step);
    if (el) {
      const isFixed = typeof window !== 'undefined' && (
        window.getComputedStyle(el).position === 'fixed' ||
        Boolean(el.closest('.mobile-bottom-nav, .floating-aside, header.fixed, nav.fixed'))
      );

      if (!isFixed) {
        // If element is already in viewport, don't scroll unnecessarily
        const rect = el.getBoundingClientRect();
        const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
        const inView = rect.top >= 40 && rect.bottom <= (winHeight - 40);
        if (!inView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
      }
      setTimeout(() => this.recalculateTargetPosition(), 220);
    } else {
      this.targetRect.set(null);
      this.popoverPos.set(this.getCenterFallbackPosition());
    }
  }

  private computePopoverPosition(target: TargetRect, preferredPlacement: TourPlacement): PopoverPosition {
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const margin = winWidth < 768 ? 12 : 16;
    const popoverWidth = Math.min(390, winWidth - margin * 2);
    
    // Measure or estimate height with safety margin
    const cardEl = this.document.querySelector('.tour-popover-card') as HTMLElement | null;
    const popoverHeight = cardEl ? Math.max(260, cardEl.offsetHeight) : 290;

    let placement: 'bottom' | 'top' | 'left' | 'right' = 'bottom';
    let top = 0;
    let left = 0;

    // Mobile specific smart positioning
    if (winWidth < 768) {
      left = (winWidth - popoverWidth) / 2;

      // Case 1: Target is near the bottom (e.g. mobile bottom navigation bar)
      if (target.top > winHeight * 0.52) {
        placement = 'top';
        const spaceAbove = target.top - margin;
        if (spaceAbove >= popoverHeight) {
          top = target.top - popoverHeight - 12;
        } else {
          // If height is tight, pin near the top
          top = margin;
        }
        return { top: Math.max(margin, top), left, placement };
      }

      // Case 2: Target is near the top
      if (target.bottom < winHeight * 0.48) {
        placement = 'bottom';
        const maxAllowedTop = Math.max(margin, winHeight - popoverHeight - 65);
        top = Math.min(maxAllowedTop, target.bottom + 12);
        return { top: Math.max(margin, top), left, placement };
      }

      // Case 3: Target is in the middle of screen - pick whichever side has more room
      const roomAbove = target.top;
      const roomBelow = winHeight - target.bottom;
      if (roomAbove > roomBelow) {
        placement = 'top';
        top = Math.max(margin, target.top - popoverHeight - 12);
      } else {
        placement = 'bottom';
        const maxAllowedTop = Math.max(margin, winHeight - popoverHeight - 65);
        top = Math.min(maxAllowedTop, target.bottom + 12);
      }

      return { top, left, placement };
    }

    // Desktop positioning logic
    const calculateVerticalPlacement = (): number => {
      const maxAllowedTop = Math.max(margin, winHeight - popoverHeight - margin);

      if (target.bottom > winHeight * 0.6) {
        const bottomAlignedTop = target.bottom - popoverHeight;
        return Math.max(margin, Math.min(maxAllowedTop, bottomAlignedTop));
      }

      const centeredTop = target.top + (target.height - popoverHeight) / 2;
      return Math.max(margin, Math.min(maxAllowedTop, centeredTop));
    };

    if (preferredPlacement === 'left' && target.left > popoverWidth + margin) {
      placement = 'left';
      top = calculateVerticalPlacement();
      left = target.left - popoverWidth - margin;
    } else if (preferredPlacement === 'right' && winWidth - target.right > popoverWidth + margin) {
      placement = 'right';
      top = calculateVerticalPlacement();
      left = target.right + margin;
    } else if (preferredPlacement === 'top' && target.top > popoverHeight + margin) {
      placement = 'top';
      top = target.top - popoverHeight - margin;
      left = Math.max(margin, Math.min(winWidth - popoverWidth - margin, target.left + (target.width - popoverWidth) / 2));
    } else if (winHeight - target.bottom > popoverHeight + margin) {
      placement = 'bottom';
      top = target.bottom + margin;
      left = Math.max(margin, Math.min(winWidth - popoverWidth - margin, target.left + (target.width - popoverWidth) / 2));
    } else if (target.left > popoverWidth + margin) {
      placement = 'left';
      top = calculateVerticalPlacement();
      left = target.left - popoverWidth - margin;
    } else {
      placement = 'bottom';
      const maxAllowedTop = Math.max(margin, winHeight - popoverHeight - margin);
      top = Math.max(margin, Math.min(maxAllowedTop, target.bottom + margin));
      left = Math.max(margin, Math.min(winWidth - popoverWidth - margin, target.left));
    }

    return { top, left, placement };
  }

  private getCenterFallbackPosition(): PopoverPosition {
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
    const margin = winWidth < 768 ? 12 : 16;
    const popoverWidth = Math.min(390, winWidth - margin * 2);
    const popoverHeight = winWidth < 768 ? 280 : 340;

    const availableHeight = winWidth < 768 ? winHeight - 70 : winHeight;

    return {
      top: Math.max(16, (availableHeight - popoverHeight) / 2),
      left: (winWidth - popoverWidth) / 2,
      placement: 'bottom',
    };
  }

  private markTourAsCompleted(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.getStorageKey(), 'true');
      localStorage.setItem('greenmind_tour_completed_guest', 'true');
    }
  }

  private getStorageKey(): string {
    return `${this.storagePrefix}${this.currentUserId}`;
  }
}
