import { Component, signal } from '@angular/core';

type ActivityStatus = 'delivered' | 'transit' | 'issue' | 'processing';

type Activity = {
  status: ActivityStatus;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  action: 'details' | 'resolve';
};

@Component({
  selector: 'app-activities',
  templateUrl: './activities.html',
})
export class Activities {
  public readonly activities = signal<Activity[]>([
    {
      status: 'delivered',
      title: 'شحنة إلى هامبورغ EX-102',
      description: 'فراولة فستيفال الممتازة (5 منصات نقالة)',
      dateTime: '24 أكتوبر 2023 • 14:30',
      location: 'ميناء هامبورغ، ألمانيا',
      action: 'details',
    },
    {
      status: 'transit',
      title: 'التخليص الجمركي - الرياض',
      description: 'فراولة فورتونا (12 منصة نقالة)',
      dateTime: '25 أكتوبر 2023 • 09:15',
      location: 'مطار الملك خالد الدولي، السعودية',
      action: 'details',
    },
    {
      status: 'issue',
      title: 'تم اكتشاف خلل في درجة الحرارة',
      description: 'انخفضت درجة حرارة الحاوية رقم MAEU1234567 عن 2 درجة مئوية',
      dateTime: '25 أكتوبر 2023 • 11:42',
      location: 'البحر الأبيض المتوسط',
      action: 'resolve',
    },
    {
      status: 'processing',
      title: 'اكتملت التعبئة - المنشأة أ',
      description: 'فراولة سنسيشن (8 منصات نقالة) جاهزة لمراقبة الجودة',
      dateTime: '25 أكتوبر 2023 • 15:00',
      location: 'مصنع التعبئة بالقاهرة، مصر',
      action: 'details',
    },
  ]);

  public statusClasses(status: ActivityStatus): string {
    switch (status) {
      case 'delivered':
        return 'bg-[#16A34A]/10 text-[#16A34A]';
      case 'transit':
        return 'bg-amber-500/10 text-amber-500';
      case 'issue':
        return 'bg-red-600/10 text-red-600';
      case 'processing':
        return 'bg-blue-600/10 text-blue-600';
    }
  }

  public statusIcon(status: ActivityStatus): string {
    switch (status) {
      case 'delivered':
        return '✓';
      case 'transit':
        return '⇄';
      case 'issue':
        return '!';
      case 'processing':
        return '▦';
    }
  }
}
