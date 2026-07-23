import { Component, computed, signal } from '@angular/core';

type PlanStatus = 'قيد التنفيذ' | 'قيد التخطيط' | 'مكتملة';
type PlanTab = 'كل الخطط' | 'نشطة' | 'مكتملة' | 'قيد التخطيط';

type ExportPlan = {
  code: string;
  title: string;
  market: string;
  status: PlanStatus;
  progress: number;
  crop: string;
  dateLabel: string;
  date: string;
  image: string;
};

@Component({
  selector: 'app-export-plans',
  templateUrl: './export-plans-view.html',
})
export class ExportPlans {
  public readonly search = signal('');
  public readonly selectedTab = signal<PlanTab>('كل الخطط');
  public readonly tabs: readonly PlanTab[] = ['كل الخطط', 'نشطة', 'مكتملة', 'قيد التخطيط'];

  public readonly plans = signal<ExportPlan[]>([
    {
      code: 'EX-2023-A',
      title: 'إكسبريس أوروبا - الربع الرابع',
      market: 'سوق ألمانيا',
      status: 'قيد التنفيذ',
      progress: 72,
      crop: 'فراولة',
      dateLabel: 'النهاية المتوقعة',
      date: '24 أكتوبر 2023',
      image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=900&q=85',
    },
    {
      code: 'EX-2023-B',
      title: 'لوجستيات الخليج الممتازة',
      market: 'المملكة العربية السعودية',
      status: 'قيد التخطيط',
      progress: 15,
      crop: 'فراولة',
      dateLabel: 'تاريخ الانطلاق',
      date: '05 نوفمبر 2023',
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=85',
    },
    {
      code: 'EX-2023-C',
      title: 'بافاريا الموسمية بالجملة',
      market: 'سوق ألمانيا',
      status: 'مكتملة',
      progress: 100,
      crop: 'فراولة',
      dateLabel: 'تاريخ الأرشفة',
      date: '12 سبتمبر 2023',
      image: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=900&q=85',
    },
    {
      code: 'EX-2023-D',
      title: 'دورة تجزئة الرياض',
      market: 'المملكة العربية السعودية',
      status: 'قيد التنفيذ',
      progress: 45,
      crop: 'فراولة',
      dateLabel: 'النهاية المتوقعة',
      date: '30 نوفمبر 2023',
      image: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?auto=format&fit=crop&w=900&q=85',
    },
  ]);

  public readonly filteredPlans = computed(() => {
    const term = this.search().trim();
    const tab = this.selectedTab();

    return this.plans().filter((plan) => {
      const matchesSearch =
        !term ||
        [plan.title, plan.market, plan.code, plan.crop].some((value) =>
          value.includes(term),
        );
      const matchesTab =
        tab === 'كل الخطط' ||
        (tab === 'نشطة' ? plan.status === 'قيد التنفيذ' : plan.status === tab);

      return matchesSearch && matchesTab;
    });
  });

  public selectTab(tab: PlanTab): void {
    this.selectedTab.set(tab);
  }
}
