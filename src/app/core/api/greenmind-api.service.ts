import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client.service';
import {
  ExportPlan, ExportPlanCreateRequest, ExportPlanDashboard, ExportPlanDetails,
  FarmAccount, FarmTask, MasterDataItem, PagedResult, PlanningStatus, PlatformStatistics,
  SoilMeasurement, SoilMeasurementRequest,
} from './api.models';

@Injectable({ providedIn: 'root' })
export class GreenmindApi {
  private readonly api = inject(ApiClient);

  public exportPlans(): Observable<ExportPlan[]> {
    return this.api.get<ExportPlan[]>('/api/farm-owner/export-plans');
  }

  public createExportPlan(request: ExportPlanCreateRequest): Observable<ExportPlanDetails> {
    return this.api.post<ExportPlanDetails>('/api/farm-owner/export-plans', request);
  }

  public exportPlan(id: number): Observable<ExportPlanDetails> {
    return this.api.get<ExportPlanDetails>(`/api/farm-owner/export-plans/${id}`);
  }

  public planningStatus(id: number): Observable<PlanningStatus> {
    return this.api.get<PlanningStatus>(`/api/farm-owner/export-plans/${id}/planning-status`);
  }

  public retryPlanning(id: number): Observable<PlanningStatus> {
    return this.api.post<PlanningStatus>(`/api/farm-owner/export-plans/${id}/planning/retry`, {});
  }

  public dashboard(id: number): Observable<ExportPlanDashboard> {
    return this.api.get<ExportPlanDashboard>(`/api/farm-owner/export-plans/${id}/dashboard`);
  }

  public soilMeasurements(id: number): Observable<SoilMeasurement[]> {
    return this.api.get<SoilMeasurement[]>(`/api/farm-owner/export-plans/${id}/soil-measurements`);
  }

  public createSoilMeasurement(id: number, request: SoilMeasurementRequest): Observable<SoilMeasurement> {
    return this.api.post<SoilMeasurement>(`/api/farm-owner/export-plans/${id}/soil-measurements`, request);
  }

  public tasks(query = ''): Observable<FarmTask[]> {
    return this.api.get<FarmTask[]>(`/api/Tasks${query ? `?${query}` : ''}`);
  }

  public updateTask(id: number, body: { status?: string; actualDate?: string; notes?: string }): Observable<void> {
    return this.api.patch<void>(`/api/Tasks/${id}`, body);
  }

  public crops(admin = false): Observable<MasterDataItem[]> {
    return this.api.get<MasterDataItem[]>(admin ? '/api/admin/crops' : '/api/farm-owner/crops');
  }

  public destinations(admin = false): Observable<MasterDataItem[]> {
    return this.api.get<MasterDataItem[]>(admin ? '/api/admin/destinations' : '/api/farm-owner/destinations');
  }

  public createCrop(body: { name: string; description: string | null }): Observable<MasterDataItem> {
    return this.api.post<MasterDataItem>('/api/admin/crops', body);
  }

  public updateCrop(id: number, body: { name: string; description: string | null }): Observable<MasterDataItem> {
    return this.api.put<MasterDataItem>(`/api/admin/crops/${id}`, body);
  }

  public setCropStatus(id: number, isActive: boolean): Observable<MasterDataItem> {
    return this.api.patch<MasterDataItem>(`/api/admin/crops/${id}/status`, { isActive });
  }

  public createDestination(body: { name: string; description: string | null }): Observable<MasterDataItem> {
    return this.api.post<MasterDataItem>('/api/admin/destinations', body);
  }

  public updateDestination(id: number, body: { name: string; description: string | null }): Observable<MasterDataItem> {
    return this.api.put<MasterDataItem>(`/api/admin/destinations/${id}`, body);
  }

  public setDestinationStatus(id: number, isActive: boolean): Observable<MasterDataItem> {
    return this.api.patch<MasterDataItem>(`/api/admin/destinations/${id}/status`, { isActive });
  }

  public statistics(): Observable<PlatformStatistics> {
    return this.api.get<PlatformStatistics>('/api/admin/statistics');
  }

  public farms(status?: 'Pending' | 'Active' | 'Inactive'): Observable<PagedResult<FarmAccount>> {
    return this.api.get<PagedResult<FarmAccount>>(`/api/admin/farms?pageSize=100${status ? `&status=${status}` : ''}`);
  }

  public approveFarm(id: number): Observable<FarmAccount> {
    return this.api.post<FarmAccount>(`/api/admin/farms/${id}/approve`, {});
  }

  public setFarmStatus(id: number, isActive: boolean): Observable<FarmAccount> {
    return this.api.patch<FarmAccount>(`/api/admin/farms/${id}/status`, { isActive });
  }
}
