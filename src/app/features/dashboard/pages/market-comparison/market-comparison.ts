import { Component, signal } from '@angular/core';

type ChecklistItem = {
  label: string;
  state: 'ready' | 'pending';
};

type MarketCard = {
  country: string;
  authority: string;
  readiness: string;
  readinessTone: 'success' | 'warning';
  residueTitle: string;
  residueStatus: string;
  residueTone: 'success' | 'danger';
  residueProgress: number;
  packaging: string;
  certificates: ChecklistItem[];
};

@Component({
  selector: 'app-market-comparison',
  templateUrl: './market-comparison.html',
})
export class MarketComparison {
  public readonly markets = signal<MarketCard[]>([
    {
      country: 'المملكة العربية السعودية',
      authority: 'معايير هيئة الغذاء والدواء',
      readiness: 'عالية (جاهز للشحن)',
      readinessTone: 'success',
      residueTitle: 'قياسي (دستور الأغذية)',
      residueStatus: 'متوافق',
      residueTone: 'success',
      residueProgress: 40,
      packaging: 'كراتين مهواة قياسية. مطلوب ملصقات باللغة العربية لوحدات التجزئة.',
      certificates: [
        { label: 'شهادة الصحة النباتية', state: 'ready' },
        { label: 'شهادة المنشأ', state: 'ready' },
        { label: 'التسجيل في هيئة الغذاء والدواء', state: 'ready' },
      ],
    },
    {
      country: 'ألمانيا',
      authority: 'معايير الاتحاد الأوروبي',
      readiness: 'متوسطة (تتطلب إجراءات)',
      readinessTone: 'warning',
      residueTitle: 'صارمة (الافتراضي 0.01 ملغ/كغم)',
      residueStatus: 'بحاجة لمراجعة',
      residueTone: 'danger',
      residueProgress: 85,
      packaging: 'عبوات قابلة لإعادة التدوير (PET/RPET). مطلوب إطالة مدة الصلاحية لمرات الترانزيت التي تزيد عن 5 أيام.',
      certificates: [
        { label: 'GLOBALG.A.P.', state: 'ready' },
        { label: 'BRCGS (في انتظار التدقيق)', state: 'pending' },
        { label: 'شهادة الصحة النباتية', state: 'ready' },
      ],
    },
  ]);

  public readonly selectedMarkets = signal([
    'ألمانيا (الاتحاد الأوروبي)',
    'المملكة العربية السعودية (SFDA)',
  ]);
}
