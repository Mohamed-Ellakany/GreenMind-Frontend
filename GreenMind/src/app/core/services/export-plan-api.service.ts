import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateExportPlanRequest,
  ExportPlan,
  ExportPlanDashboard,
} from '../../shared/models/export-plan.model';

@Injectable({ providedIn: 'root' })
export class ExportPlanApiService {
  private readonly http = inject(HttpClient);

  list(): Observable<ExportPlan[]> {
    return this.http.get<ExportPlan[]>(`${environment.apiBaseUrl}/export-plans`);
  }

  create(payload: CreateExportPlanRequest): Observable<ExportPlan> {
    return this.http.post<ExportPlan>(`${environment.apiBaseUrl}/export-plans`, payload);
  }

  getById(exportPlanId: string): Observable<ExportPlan> {
    return this.http.get<ExportPlan>(
      `${environment.apiBaseUrl}/export-plans/${exportPlanId}`,
    );
  }

  getDashboard(exportPlanId: string): Observable<ExportPlanDashboard> {
    return this.http.get<ExportPlanDashboard>(
      `${environment.apiBaseUrl}/export-plans/${exportPlanId}/dashboard`,
    );
  }
}
