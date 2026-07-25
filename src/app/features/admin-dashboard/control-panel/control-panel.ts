import { Component, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBell,
  faEllipsisVertical,
  faMagnifyingGlass,
  faPlus,
  faSeedling,
  faShieldHeart,
  faUserClock,
  faUsers,
} from '@fortawesome/free-solid-svg-icons';

type PendingUser = {
  initials: string;
  name: string;
  email: string;
  role: string;
  tone: 'green' | 'pink';
};

type User = {
  name: string;
  email: string;
  role: string;
  location: string;
  lastActivity: string;
  status: 'نشط' | 'موقوف';
  avatar: string;
};

@Component({
  selector: 'app-control-panel',
  imports: [FontAwesomeModule],
  templateUrl: './control-panel.html',
})
export class ControlPanel {
  public readonly icons = {
    add: faPlus,
    alert: faBell,
    farmer: faSeedling,
    menu: faEllipsisVertical,
    pending: faUserClock,
    search: faMagnifyingGlass,
    system: faShieldHeart,
    users: faUsers,
  };

  public readonly stats = signal([
    { label: 'إجمالي المستخدمين', value: '1,284', icon: this.icons.users, tone: 'text-[#006b2c] bg-green-50' },
    { label: 'طلبات معلقة', value: '12', icon: this.icons.pending, tone: 'text-amber-500 bg-amber-50' },
    { label: 'المزارعون النشطون', value: '842', icon: this.icons.farmer, tone: 'text-blue-600 bg-blue-50' },
    { label: 'سلامة النظام', value: '99.9%', icon: this.icons.system, tone: 'text-[#006b2c] bg-green-50' },
  ]);

  public readonly pendingUsers = signal<PendingUser[]>([
    { initials: 'مح', name: 'محمود أحمد', email: 'm.ahmed@fayoum-farm.eg', role: 'مزارع', tone: 'green' },
    { initials: 'نس', name: 'نادية سليمان', email: 'n.soliman@nile-exports.com', role: 'مصدر', tone: 'pink' },
  ]);

  public readonly users = signal<User[]>([
    {
      name: 'أمير منصور',
      email: 'amir.m@ismailia-agro.eg',
      role: 'مزارع',
      location: 'الإسماعيلية',
      lastActivity: 'منذ ساعتين',
      status: 'نشط',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    },
    {
      name: 'سارة خليل',
      email: 's.khalil@nile-logistics.com',
      role: 'مصدر',
      location: 'القاهرة',
      lastActivity: 'منذ 10 دقائق',
      status: 'نشط',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    },
    {
      name: 'عمر الجوهري',
      email: 'omar.g@delta-berry.eg',
      role: 'مزارع',
      location: 'البحيرة',
      lastActivity: 'منذ 3 أيام',
      status: 'موقوف',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    },
  ]);
}
