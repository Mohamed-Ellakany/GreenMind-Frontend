import { Component, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

type Account = {
  name: string;
  email: string;
  type: string;
  status: 'نشط' | 'معلق' | 'موقوف';
  joinedAt: string;
};

@Component({
  selector: 'app-accounts',
  imports: [FontAwesomeModule],
  templateUrl: './accounts.html',
})
export class Accounts {
  public readonly icons = {
    add: faPlus,
    edit: faPen,
    delete: faTrash,
  };

  public readonly accounts = signal<Account[]>([
    { name: 'شركة النيل للتصدير', email: 'ops@nile-exports.com', type: 'مصدر', status: 'نشط', joinedAt: '2026/07/01' },
    { name: 'مزارع الفيوم الذكية', email: 'hello@fayoum-farms.eg', type: 'مزارع', status: 'معلق', joinedAt: '2026/07/10' },
    { name: 'دلتا بيري', email: 'admin@delta-berry.eg', type: 'مزارع', status: 'موقوف', joinedAt: '2026/06/18' },
  ]);
}
