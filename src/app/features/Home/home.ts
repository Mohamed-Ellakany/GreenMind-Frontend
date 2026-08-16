import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, HostListener, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GreenmindApi } from '@core/api/greenmind-api.service';

type Feature = {
  icon: string;
  title: string;
  description: string;
};

type Benefit = {
  icon: string;
  title: string;
  description: string;
};

export type ShowcaseSlide = {
  id: string;
  tabTitle: string;
  tabSubtitle: string;
  headline: string;
  tagline: string;
  badge: string;
  imageSrc: string;
  imageAlt: string;
  metrics: { label: string; value: string; highlight?: boolean }[];
  highlightNotes: string[];
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);

  public readonly mobileNavigationOpen = signal(false);
  public readonly activeSection = signal<'top' | 'features' | 'platform' | 'contact'>('top');

  // Interactive Platform Showcase Slider
  public readonly activeSlideIndex = signal(0);
  private sliderIntervalId: ReturnType<typeof setInterval> | null = null;
  public readonly isSliderPaused = signal(false);

  public readonly showcaseSlides: ShowcaseSlide[] = [
    {
      id: 'crop-health',
      tabTitle: 'متابعة صحة المحصول',
      tabSubtitle: 'كشف ذكي وتشخيص دقيق',
      headline: 'رؤية حاسوبية وتشخيص فوري للآفات والأمراض',
      tagline: 'التقط صورة للأوراق أو الثمار المصابة وسيتولى عم خضر بالذكاء الاصطناعي تحديد المسبب المرضي واقتراح خطة علاجية متوافقة.',
      badge: 'دقة تشخيص 98.4%',
      imageSrc: '/landing-page/greenhouse.jpg',
      imageAlt: 'صوبة زراعية حديثة تديرها تقنيات جرين مايند لمراقبة صحة النبات',
      metrics: [
        { label: 'جاهزية القرار', value: '100% متكامل', highlight: true },
        { label: 'كفاءة المياه', value: '+14% توفير' },
        { label: 'حالة الصوبة', value: 'مثالية 24°' },
      ],
      highlightNotes: [
        'تشخيص فوري بدون انتظار مع مراجع علمية موثقة',
        'توصيات وقائية تقلل الاعتماد على المبيدات الكيميائية',
      ],
    },
    {
      id: 'market-compliance',
      tabTitle: 'امتثال متطلبات السوق',
      tabSubtitle: 'مواصفات التصدير ومتبقيات المبيدات',
      headline: 'مطابقة مواصفات الاتحاد الأوروبي والخليج تلقائياً',
      tagline: 'تتبع اشتراطات GlobalG.A.P والحدود القصوى لمتبقيات المبيدات (MRLs) وفترات الأمان قبل الحصاد لضمان قبول الشحنة دون رفض.',
      badge: 'GlobalG.A.P متوافق',
      imageSrc: '/landing-page/hero-farm.jpg',
      imageAlt: 'مزرعة تصديرية تلبي معايير الجودة والامتثال الدولية',
      metrics: [
        { label: 'متبقيات المبيدات MRLs', value: '0.00 ppm آمن', highlight: true },
        { label: 'سجل العمليات', value: 'موثق رقمياً' },
        { label: 'شهادة الجودة', value: 'جاهزة للتحميل' },
      ],
      highlightNotes: [
        'فحص مسبق لشهادات التحليل ومطابقة متطلبات المستورد',
        'تنبيهات فورية عند تجاوز فترات الأمان أو الجرعات المحددة',
      ],
    },
    {
      id: 'harvest-schedule',
      tabTitle: 'مواعيد الحصاد والتصدير',
      tabSubtitle: 'جدول زمني وخطة شحن محكمة',
      headline: 'توقيتات دقيقة من الشتلة حتى وصول الحاوية للميناء',
      tagline: 'حوّل خطة الموسم إلى جدول مهام ذكي يتكيف مع الطقس ونمو النبات وتغيرات مواعيد الشحن الجوي والبحري.',
      badge: 'تتبع الشحنات 24/7',
      imageSrc: '/landing-page/greenhouse.jpg',
      imageAlt: 'مزرعة حديثة تتابع مواعيد الحصاد والشحن بدقة',
      metrics: [
        { label: 'موعد الحصاد المتوقع', value: 'متبقي 18 يوماً', highlight: true },
        { label: 'جاهزية الشحن', value: '92% مكتمل' },
        { label: 'نسبة التصدير', value: 'الدرجة الأولى 95%' },
      ],
      highlightNotes: [
        'ربط المهام اليومية بالعمالة والمعدات لتفادي التأخير',
        'توقعات إنتاجية واقعية تدعم تسعير المحصول مسبقاً',
      ],
    },
  ];

  public readonly features: Feature[] = [
    {
      icon: '✦',
      title: 'التخطيط بالذكاء الاصطناعي',
      description: 'نحلل بيانات التربة والمناخ ونحولها إلى جداول زراعية واضحة تساعدك على رفع الإنتاجية.',
    },
    {
      icon: '✓',
      title: 'تتبع الامتثال',
      description: 'راقب متطلبات GlobalG.A.P وحدود متبقيات المبيدات وسجلات التشغيل قبل التصدير.',
    },
    {
      icon: '◉',
      title: 'كشف الأمراض',
      description: 'استخدم الرؤية الحاسوبية لاكتشاف الآفات والأمراض مبكرا وتقليل الهدر واستخدام المبيدات.',
    },
  ];

  public readonly benefits: Benefit[] = [
    {
      icon: '↗',
      title: 'زيادة العائد',
      description: 'تحسين الموارد وتقليل القرارات المتأخرة يساعدان على رفع هامش الربح في كل موسم.',
    },
    {
      icon: '◎',
      title: 'توسع عالمي',
      description: 'افتح أسواق الاتحاد الأوروبي والخليج بخطط امتثال واضحة ومتابعة تنفيذ دقيقة.',
    },
    {
      icon: '▤',
      title: 'تقارير فورية',
      description: 'لوحات متابعة حية لحالة المزرعة والشحنات ومؤشرات الجاهزية للتصدير.',
    },
    {
      icon: '♙',
      title: 'مساعد ذكي',
      description: 'إجابات سياقية عن العلاجات، الحصاد، الاشتراطات، وخطط التصدير المناسبة.',
    },
  ];

  // Contact Form Signals
  public readonly contactFullName = signal('');
  public readonly contactEmail = signal('');
  public readonly contactPhone = signal('');
  public readonly contactSubject = signal('استفسار عن المنصة');
  public readonly contactMessage = signal('');
  public readonly contactSubmitting = signal(false);
  public readonly contactSuccess = signal(false);
  public readonly contactError = signal<string | null>(null);

  public ngOnInit(): void {
    this.setupScrollSpy();
    this.startSliderAutoPlay();
  }

  private setupScrollSpy(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const sectionIds: ('top' | 'features' | 'platform' | 'contact')[] = ['top', 'features', 'platform', 'contact'];
    
    // Check initial hash
    const currentHash = window.location.hash.replace('#', '') as 'top' | 'features' | 'platform' | 'contact';
    if (sectionIds.includes(currentHash)) {
      this.activeSection.set(currentHash);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id') as 'top' | 'features' | 'platform' | 'contact';
            if (id && sectionIds.includes(id)) {
              this.activeSection.set(id);
            }
          }
        }
      },
      {
        root: null,
        rootMargin: '-20% 0px -55% 0px',
        threshold: 0.1,
      }
    );

    setTimeout(() => {
      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 100);

    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      this.stopSliderAutoPlay();
    });
  }

  public scrollToSection(sectionId: string, event?: Event): void {
    if (event) event.preventDefault();
    this.closeMobileNavigation();
    
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.activeSection.set(sectionId as 'top' | 'features' | 'platform' | 'contact');
      if (typeof window !== 'undefined') {
        history.replaceState(null, '', `#${sectionId}`);
      }
    }
  }

  // Slider Logic
  public selectSlide(index: number): void {
    this.activeSlideIndex.set(index);
    this.restartSliderAutoPlay();
  }

  public nextSlide(): void {
    const next = (this.activeSlideIndex() + 1) % this.showcaseSlides.length;
    this.activeSlideIndex.set(next);
  }

  public prevSlide(): void {
    const prev = (this.activeSlideIndex() - 1 + this.showcaseSlides.length) % this.showcaseSlides.length;
    this.activeSlideIndex.set(prev);
  }

  public pauseSlider(): void {
    this.isSliderPaused.set(true);
    this.stopSliderAutoPlay();
  }

  public resumeSlider(): void {
    this.isSliderPaused.set(false);
    this.startSliderAutoPlay();
  }

  private startSliderAutoPlay(): void {
    this.stopSliderAutoPlay();
    this.sliderIntervalId = setInterval(() => {
      if (!this.isSliderPaused()) {
        this.nextSlide();
      }
    }, 6000);
  }

  private restartSliderAutoPlay(): void {
    this.stopSliderAutoPlay();
    this.startSliderAutoPlay();
  }

  private stopSliderAutoPlay(): void {
    if (this.sliderIntervalId) {
      clearInterval(this.sliderIntervalId);
      this.sliderIntervalId = null;
    }
  }

  // Contact Form Submission
  public submitContactForm(formEvent?: Event): void {
    if (formEvent) formEvent.preventDefault();

    const name = this.contactFullName().trim();
    const email = this.contactEmail().trim();
    const phone = this.contactPhone().trim();
    const subject = this.contactSubject().trim();
    const message = this.contactMessage().trim();

    if (!name) {
      this.contactError.set('يرجى كتابة اسمك الكريم.');
      return;
    }

    if (!email || !email.includes('@')) {
      this.contactError.set('يرجى كتابة بريد إلكتروني صالح.');
      return;
    }

    if (!message || message.length < 5) {
      this.contactError.set('يرجى كتابة تفاصيل استفسارك (5 أحرف على الأقل).');
      return;
    }

    this.contactSubmitting.set(true);
    this.contactError.set(null);
    this.contactSuccess.set(false);

    this.api
      .submitContactMessage({
        fullName: name,
        email,
        phoneNumber: phone || null,
        subject: subject || null,
        message,
      })
      .pipe(
        finalize(() => this.contactSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.contactSuccess.set(true);
          this.contactFullName.set('');
          this.contactEmail.set('');
          this.contactPhone.set('');
          this.contactSubject.set('استفسار عن المنصة');
          this.contactMessage.set('');
        },
        error: (err) => {
          const errorMsg = err?.error?.message || 'تعذر إرسال رسالتك حالياً. يمكنك التواصل مباشرة عبر البريد الإلكتروني.';
          this.contactError.set(errorMsg);
        },
      });
  }

  public toggleMobileNavigation(): void {
    this.mobileNavigationOpen.update((open) => !open);
  }

  public closeMobileNavigation(): void {
    this.mobileNavigationOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  public closeNavigationWithEscape(): void {
    this.closeMobileNavigation();
  }
}
