import { Component, signal } from '@angular/core';

type Suggestion = {
  icon: string;
  text: string;
};

type CompliancePoint = {
  name: string;
  value: string;
  period: string;
};

@Component({
  selector: 'app-ai-agent',
  templateUrl: './ai-agent.html',
})
export class AiAgent {
  public readonly suggestions = signal<Suggestion[]>([
    {
      icon: '▣',
      text: 'هل يمكنني الحصاد الأسبوع القادم بناء على حدود متبقيات المبيدات؟',
    },
    {
      icon: '+',
      text: 'أوصي بعلاج لمرض البوتريتيس',
    },
    {
      icon: '✓',
      text: 'تحقق من الامتثال للاتحاد الأوروبي للقطعة 4B',
    },
  ]);

  public readonly recentAnalyses = signal([
    'تحديث حدود متبقيات SFDA',
    'متطلبات دخول سوق المملكة المتحدة',
    'تحليل مبيد ألفا',
  ]);

  public readonly compliancePoints = signal<CompliancePoint[]>([
    {
      name: 'سايبرودينيل (EU MRL)',
      value: '5.0 ملغ/كغم',
      period: 'فترة الحصاد المطلوبة: 7 أيام',
    },
    {
      name: 'فلو ديوكسونيل (EU MRL)',
      value: '3.0 ملغ/كغم',
      period: 'فترة الحصاد المطلوبة: 3 أيام',
    },
  ]);
}
