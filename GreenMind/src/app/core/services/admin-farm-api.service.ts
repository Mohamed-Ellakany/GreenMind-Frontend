import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Farm } from '../../shared/models/farm.model';

@Injectable({ providedIn: 'root' })
export class AdminFarmApiService {
  private readonly http = inject(HttpClient);

  listFarms(): Observable<Farm[]> {
    return this.http.get<Farm[]>(`${environment.apiBaseUrl}/admin/farms`);
  }

  getFarm(farmId: string): Observable<Farm> {
    return this.http.get<Farm>(`${environment.apiBaseUrl}/admin/farms/${farmId}`);
  }

  approveFarm(farmId: string): Observable<Farm> {
    return this.http.patch<Farm>(`${environment.apiBaseUrl}/admin/farms/${farmId}/approve`, {});
  }

  activateFarm(farmId: string): Observable<Farm> {
    return this.http.patch<Farm>(`${environment.apiBaseUrl}/admin/farms/${farmId}/activate`, {});
  }

  deactivateFarm(farmId: string): Observable<Farm> {
    return this.http.patch<Farm>(`${environment.apiBaseUrl}/admin/farms/${farmId}/deactivate`, {});
  }
}
