import { Component, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

type Destination = {
  country: string;
  port: string;
  requirements: string;
  risk: 'منخفض' | 'متوسط' | 'مرتفع';
  status: 'متاح' | 'مراجعة';
};

@Component({
  selector: 'app-destinations',
  imports: [FontAwesomeModule],
  templateUrl: './destinations.html',
})
export class Destinations {
  public readonly icons = {
    add: faPlus,
    edit: faPen,
    delete: faTrash,
  };

  public readonly destinations = signal<Destination[]>([
    { country: 'السعودية', port: 'جدة الإسلامي', requirements: 'شهادة صحة نباتية', risk: 'منخفض', status: 'متاح' },
    { country: 'الإمارات', port: 'جبل علي', requirements: 'تحليل متبقيات', risk: 'متوسط', status: 'متاح' },
    { country: 'هولندا', port: 'روتردام', requirements: 'Global G.A.P', risk: 'مرتفع', status: 'مراجعة' },
  ]);
}
