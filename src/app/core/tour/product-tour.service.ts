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
      title: 'لوحة التحكم والمؤشرات الحية',
      badge: 'نظرة عامة',
      icon: faHouse,
      iconEmoji: '📊',
      description:
        'نقطة انطلاقك اليومية! تمنحك لوحة التحكم ملخصاً فورياً عن جاهزية التصدير، تنبيهات الطقس الاستباقية، ومؤشرات الإنجاز لجميع محاصيل مزرعتك.',
      tip: 'تُحدّث المؤشرات تلقائياً فور تسجيل المهام والقراءات الحقلية.',
      placement: 'left',
      route: '/dashboard',
      highlightPadding: 8,
    },
    {
      id: 'activities',
      targetSelector: '[data-tour="activities"]',
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
      title: 'الإحصائيات والتقارير',
      badge: 'تحليل الأداء',
      icon: faFileLines,
      iconEmoji: '📈',
      description:
        'لوحات تحليلية دقيقة تتابع حجم الإنتاجية، التكاليف والمصروفات، ومؤشرات الامتثال لمعايير الجودة والتصدير.',
      tip: 'يمكنك استخراج تقارير تفصيلية جاهزة للجهات التفتيشية والرقابية.',
      placement: 'left',
      route: '/dashboard',
      highlightPadding: 8,
    },
    {
      id: 'export-plans',
      targetSelector: '[data-tour="export-plans"]',
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
      title: 'إعدادات الحساب والمزرعة',
      badge: 'الملف والتخصيص',
      icon: faGear,
      iconEmoji: '⚙️',
      description:
        'إدارة بيانات المزرعة، المساحة، المواقع الجغرافية، الملف الشخصي، وتفضيلات الإشعارات والأمان.',
      tip: 'تأكد من اكتمال بيانات المزرعة لتوليد خطط تصدير بدقة أعلى.',
      placement: 'left',
      route: '/dashboard',
      highlightPadding: 8,
    },
    {
      id: 'support-center',
      targetSelector: '[data-tour="support"]',
      title: 'مركز المساعدة وإعادة الجولة',
      badge: 'الدعم والمساعدة',
      icon: faCircleQuestion,
      iconEmoji: '💬',
      description:
        'فريق الدعم الفني والزراعي في خدمتك دائماً عبر الشات المباشر. كما يمكنك إعادة تشغيل هذه الجولة التعريفية في أي وقت بنقرة واحدة من هنا.',
      tip: 'يمكنك أيضاً استخدام شريط البحث السريع أعلى المنصة للتنقل الفوري.',
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

    const el = this.document.querySelector(step.targetSelector) as HTMLElement | null;
    if (!el) {
      this.targetRect.set(null);
      this.popoverPos.set(this.getCenterFallbackPosition());
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = step.highlightPadding ?? 8;

    const targetRect: TargetRect = {
      top: Math.max(0, rect.top - padding),
      left: Math.max(0, rect.left - padding),
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      bottom: rect.bottom + padding,
      right: rect.right + padding,
    };

    this.targetRect.set(targetRect);
    this.popoverPos.set(this.computePopoverPosition(targetRect, step.placement || 'auto'));
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
    const el = this.document.querySelector(step.targetSelector) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      setTimeout(() => this.recalculateTargetPosition(), 220);
    } else {
      this.targetRect.set(null);
      this.popoverPos.set(this.getCenterFallbackPosition());
    }
  }

  private computePopoverPosition(target: TargetRect, preferredPlacement: TourPlacement): PopoverPosition {
    const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    const popoverWidth = Math.min(390, winWidth - 32);
    // Measure or estimate height with safety margin
    const cardEl = this.document.querySelector('.tour-popover-card') as HTMLElement | null;
    const popoverHeight = cardEl ? Math.max(320, cardEl.offsetHeight) : 340;
    const margin = 16;

    let placement: 'bottom' | 'top' | 'left' | 'right' = 'bottom';
    let top = 0;
    let left = 0;

    // Mobile fallback: position nicely centered or above bottom navigation
    if (winWidth < 768) {
      const maxMobileTop = Math.max(margin, winHeight - popoverHeight - 75);
      return {
        top: Math.max(margin, Math.min(maxMobileTop, target.bottom + margin)),
        left: (winWidth - popoverWidth) / 2,
        placement: 'bottom',
      };
    }

    // Determine vertical position with smart bottom-alignment for items near the viewport bottom
    const calculateVerticalPlacement = (): number => {
      const maxAllowedTop = Math.max(margin, winHeight - popoverHeight - margin);

      // If target is in the lower 40% of the screen, align popover's bottom with target's bottom
      if (target.bottom > winHeight * 0.6) {
        const bottomAlignedTop = target.bottom - popoverHeight;
        return Math.max(margin, Math.min(maxAllowedTop, bottomAlignedTop));
      }

      // Otherwise center popover with target
      const centeredTop = target.top + (target.height - popoverHeight) / 2;
      return Math.max(margin, Math.min(maxAllowedTop, centeredTop));
    };

    // Determine horizontal placement
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
    const popoverWidth = Math.min(390, winWidth - 32);
    const popoverHeight = 340;

    return {
      top: Math.max(16, (winHeight - popoverHeight) / 2),
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
