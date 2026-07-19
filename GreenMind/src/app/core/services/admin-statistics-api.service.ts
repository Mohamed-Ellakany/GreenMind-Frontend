import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface StatisticsBreakdownItem {
  cropName?: string;
  destinationName?: string;
  count: number;
}

export interface AdminStatistics {
  totalFarms: number;
  activeFarms: number;
  inactiveFarms: number;
  totalExportPlans: number;
  plansByCrop: { cropName: string; count: number }[];
  plansByDestination: { destinationName: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class AdminStatisticsApiService {
  private readonly http = inject(HttpClient);

  getStatistics(): Observable<AdminStatistics> {
    return this.http.get<AdminStatistics>(`${environment.apiBaseUrl}/admin/statistics`);
  }
}
