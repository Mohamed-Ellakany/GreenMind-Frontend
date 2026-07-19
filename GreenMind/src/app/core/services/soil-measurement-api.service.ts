import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CreateSoilMeasurementRequest,
  SoilMeasurement,
} from '../../shared/models/soil-measurement.model';

@Injectable({ providedIn: 'root' })
export class SoilMeasurementApiService {
  private readonly http = inject(HttpClient);

  list(exportPlanId: string): Observable<SoilMeasurement[]> {
    return this.http.get<SoilMeasurement[]>(
      `${environment.apiBaseUrl}/export-plans/${exportPlanId}/soil-measurements`,
    );
  }

  create(
    exportPlanId: string,
    payload: CreateSoilMeasurementRequest,
  ): Observable<SoilMeasurement> {
    return this.http.post<SoilMeasurement>(
      `${environment.apiBaseUrl}/export-plans/${exportPlanId}/soil-measurements`,
      payload,
    );
  }

  getById(exportPlanId: string, measurementId: string): Observable<SoilMeasurement> {
    return this.http.get<SoilMeasurement>(
      `${environment.apiBaseUrl}/export-plans/${exportPlanId}/soil-measurements/${measurementId}`,
    );
  }

  update(
    exportPlanId: string,
    measurementId: string,
    payload: CreateSoilMeasurementRequest,
  ): Observable<SoilMeasurement> {
    return this.http.put<SoilMeasurement>(
      `${environment.apiBaseUrl}/export-plans/${exportPlanId}/soil-measurements/${measurementId}`,
      payload,
    );
  }

  delete(exportPlanId: string, measurementId: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiBaseUrl}/export-plans/${exportPlanId}/soil-measurements/${measurementId}`,
    );
  }
}
