import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({ selector: 'app-phase-two-legacy-redirect', template: '' })
export class PhaseTwoLegacyRedirect {
  public constructor() {
    const route = inject(ActivatedRoute);
    const router = inject(Router);
    const id = Number(route.snapshot.paramMap.get('id'));
    const tab = route.snapshot.queryParamMap.get('tab');
    const destination = tab === 'costs'
      ? 'budget-expenses'
      : tab === 'disease'
        ? 'crop-health'
        : 'agricultural-advisor';
    const queryParams = route.snapshot.queryParamMap.get('prompt')
      ? { prompt: route.snapshot.queryParamMap.get('prompt') }
      : undefined;
    void router.navigate(['/export-plans', id, destination], { queryParams, replaceUrl: true });
  }
}
