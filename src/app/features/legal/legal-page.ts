import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type LegalPageKind = 'terms' | 'privacy';

@Component({
  selector: 'app-legal-page',
  imports: [RouterLink],
  templateUrl: './legal-page.html',
  styleUrl: './legal-page.css',
})
export class LegalPage {
  private readonly route = inject(ActivatedRoute);

  public readonly kind = this.route.snapshot.data['kind'] as LegalPageKind;
  public readonly isPrivacy = this.kind === 'privacy';
}
