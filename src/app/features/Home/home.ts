import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

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

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
})
export class Home {
  public readonly mobileNavigationOpen = signal(false);

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
