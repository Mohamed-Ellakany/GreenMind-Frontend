import { Component, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPen, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';

type Product = {
  name: string;
  category: string;
  season: string;
  markets: number;
  status: 'نشط' | 'غير نشط';
};

@Component({
  selector: 'app-products',
  imports: [FontAwesomeModule],
  templateUrl: './products.html',
})
export class Products {
  public readonly icons = {
    add: faPlus,
    edit: faPen,
    delete: faTrash,
  };

  public readonly products = signal<Product[]>([
    { name: 'فراولة طازجة', category: 'فاكهة', season: 'ديسمبر - أبريل', markets: 8, status: 'نشط' },
    { name: 'بطاطس', category: 'خضروات', season: 'يناير - يونيو', markets: 12, status: 'نشط' },
    { name: 'عنب أحمر', category: 'فاكهة', season: 'مايو - أغسطس', markets: 6, status: 'غير نشط' },
  ]);
}
