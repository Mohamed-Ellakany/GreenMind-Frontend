import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GreenmindApi } from '@core/api/greenmind-api.service';
import { ExportPlan } from '@core/api/api.models';
import { NotificationCenterService } from '@core/settings/notification-center.service';

type ChecklistItem = {
  label: string;
  state: 'ready' | 'pending';
};

type MarketTone = 'success' | 'warning' | 'danger';

type MarketOption = {
  key: string;
  label: string;
  authority: string;
};

type MarketProfile = MarketOption & {
  residueTitle: string;
  packaging: string;
  baseScore: number;
  certificates: ChecklistItem[];
  riskNotes: string[];
};

type MarketCard = MarketProfile & {
  readiness: string;
  readinessTone: MarketTone;
  residueStatus: string;
  residueTone: MarketTone;
  residueProgress: number;
  score: number;
};

type ComparisonResult = {
  plan: ExportPlan;
  markets: MarketCard[];
  recommendation: string;
  winner: MarketCard;
};

const marketProfiles: MarketProfile[] = [
  {
    key: 'european-union',
    label: 'الاتحاد الأوروبي',
    authority: 'معايير الاتحاد الأوروبي',
    residueTitle: 'صارمة: الافتراضي 0.01 ملغ/كغم عند غياب MRL',
    packaging: 'عبوات قابلة لإعادة التدوير مع تتبع تشغيلة واضح. يلزم ضبط سلسلة التبريد وشهادات الجودة.',
    baseScore: 72,
    certificates: [
      { label: 'GLOBALG.A.P.', state: 'ready' },
      { label: 'BRCGS أو مكافئ', state: 'pending' },
      { label: 'شهادة الصحة النباتية', state: 'ready' },
    ],
    riskNotes: ['مراجعة تطبيقات المبيدات المتأخرة', 'تأكيد حد MRL لكل مادة فعالة'],
  },
  {
    key: 'saudi-arabia',
    label: 'المملكة العربية السعودية',
    authority: 'هيئة الغذاء والدواء SFDA',
    residueTitle: 'قياسي: اعتماد واسع على Codex واشتراطات SFDA',
    packaging: 'كراتين مهواة وملصقات عربية واضحة لوحدات التجزئة مع بيانات المنشأ والصلاحية.',
    baseScore: 88,
    certificates: [
      { label: 'شهادة الصحة النباتية', state: 'ready' },
      { label: 'شهادة المنشأ', state: 'ready' },
      { label: 'مطابقة متطلبات SFDA', state: 'ready' },
    ],
    riskNotes: ['مراجعة بيانات الملصق العربي', 'تأكيد اشتراطات المستورد'],
  },
  {
    key: 'united-arab-emirates',
    label: 'الإمارات العربية المتحدة',
    authority: 'وزارة التغير المناخي والبيئة',
    residueTitle: 'متوسط: مراجعة متطلبات الدخول والملصقات',
    packaging: 'تغليف مقاوم للرطوبة وبيانات تتبع واضحة مع عناية بدرجات الحرارة أثناء النقل.',
    baseScore: 82,
    certificates: [
      { label: 'شهادة الصحة النباتية', state: 'ready' },
      { label: 'شهادة المنشأ', state: 'ready' },
      { label: 'متطلبات المستورد', state: 'pending' },
    ],
    riskNotes: ['تأكيد مواصفات العبوة مع العميل', 'مراجعة مدة الترانزيت'],
  },
  {
    key: 'united-kingdom',
    label: 'المملكة المتحدة',
    authority: 'UK Border واشتراطات التجزئة',
    residueTitle: 'صارمة: قريبة من منهج الاتحاد الأوروبي',
    packaging: 'اشتراطات تتبع وملصقات إنجليزية، مع تركيز قوي على شهادات الجودة وسلسلة التبريد.',
    baseScore: 76,
    certificates: [
      { label: 'GLOBALG.A.P.', state: 'ready' },
      { label: 'شهادة الصحة النباتية', state: 'ready' },
      { label: 'تدقيق عميل التجزئة', state: 'pending' },
    ],
    riskNotes: ['مراجعة بقايا المبيدات', 'تأكيد متطلبات العميل النهائي'],
  },
];

@Component({
  selector: 'app-market-comparison',
  imports: [FormsModule, RouterLink],
  templateUrl: './market-comparison.html',
})
export class MarketComparison {
  private readonly api = inject(GreenmindApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationCenterService);

  public readonly plans = signal<ExportPlan[]>([]);
  public readonly loading = signal(true);
  public readonly error = signal<string | null>(null);
  public readonly result = signal<ComparisonResult | null>(null);
  public readonly marketOptions: MarketOption[] = marketProfiles.map(({ key, label, authority }) => ({ key, label, authority }));

  public selectedPlanId: number | null = null;
  public firstMarketKey = 'european-union';
  public secondMarketKey = 'saudi-arabia';

  public constructor() {
    this.api.exportPlans()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plans) => {
          this.plans.set(plans);
          this.selectedPlanId = plans[0]?.id ?? null;
          this.loading.set(false);
        },
        error: () => {
          this.error.set('تعذر تحميل خطط التصدير.');
          this.loading.set(false);
        },
      });
  }

  public compare(): void {
    this.error.set(null);
    const plan = this.plans().find((item) => item.id === Number(this.selectedPlanId));
    if (!plan) {
      this.error.set('اختر خطة تصدير أولاً.');
      return;
    }

    if (this.firstMarketKey === this.secondMarketKey) {
      this.error.set('اختر بلدين مختلفين للمقارنة.');
      return;
    }

    const selectedProfiles = [this.firstMarketKey, this.secondMarketKey]
      .map((key) => marketProfiles.find((market) => market.key === key))
      .filter((market): market is MarketProfile => !!market);

    if (selectedProfiles.length !== 2) {
      this.error.set('راجع اختيارات الأسواق ثم حاول مرة أخرى.');
      return;
    }

    const cards = selectedProfiles.map((market) => this.buildMarketCard(market, plan));
    const winner = [...cards].sort((a, b) => b.score - a.score)[0];
    const result: ComparisonResult = {
      plan,
      markets: cards,
      winner,
      recommendation: this.buildRecommendation(plan, winner, cards),
    };

    this.result.set(result);
    this.notifications.push({
      title: 'تم تشغيل مقارنة الأسواق',
      body: `أفضل اختيار حالياً لخطة ${plan.name}: ${winner.label}.`,
      channel: 'markets',
      tone: 'success',
    });
  }

  private buildMarketCard(market: MarketProfile, plan: ExportPlan): MarketCard {
    const destinationMatch = this.normalized(plan.destination).includes(this.normalized(market.label))
      || this.normalized(market.label).includes(this.normalized(plan.destination))
      || (market.key === 'european-union' && this.normalized(plan.destination).includes('european'));
    const planningBonus = plan.planningStatus === 'Succeeded' ? 6 : plan.planningStatus === 'InProgress' ? 2 : -4;
    const destinationBonus = destinationMatch ? 8 : 0;
    const score = Math.max(35, Math.min(98, market.baseScore + planningBonus + destinationBonus));
    const pendingCount = market.certificates.filter((certificate) => certificate.state === 'pending').length;
    const residueTone: MarketTone = score >= 86 ? 'success' : score >= 72 ? 'warning' : 'danger';

    return {
      ...market,
      score,
      readiness: score >= 86 ? 'عالية وجاهزة للمتابعة' : score >= 72 ? 'متوسطة وتحتاج إجراءات' : 'منخفضة وتحتاج مراجعة',
      readinessTone: score >= 86 ? 'success' : score >= 72 ? 'warning' : 'danger',
      residueStatus: pendingCount === 0 && residueTone === 'success' ? 'متوافق غالباً' : 'بحاجة لمراجعة',
      residueTone,
      residueProgress: Math.max(18, Math.min(100, score)),
    };
  }

  private buildRecommendation(plan: ExportPlan, winner: MarketCard, cards: MarketCard[]): string {
    const other = cards.find((market) => market.key !== winner.key);
    const otherText = other ? ` أما ${other.label} فيحتاج أولاً إلى ${other.riskNotes[0]}.` : '';
    return `بالنسبة لخطة ${plan.name} لمحصول ${plan.crop}، السوق الأقوى حالياً هو ${winner.label} بدرجة جاهزية ${winner.score}%. ركّز قبل الشحن على ${winner.riskNotes[0]} و${winner.riskNotes[1]}.${otherText}`;
  }

  private normalized(value: string): string {
    return value.toLowerCase().replace(/[()،.]/g, '').trim();
  }
}
