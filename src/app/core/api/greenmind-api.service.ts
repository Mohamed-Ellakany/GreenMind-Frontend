import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client.service';
import {
  ExportPlan, ExportPlanCreateRequest, ExportPlanDashboard, ExportPlanDetails,
  ExportPlanScheduleAnalysis, ExportPlanScheduleAnalysisRequest,
  AdminInvitation, AdminUser, FarmAccount, FarmTask, MasterDataItem, PagedResult, PlanningStatus, PlatformStatistics,
  RagIngestionResult, RegulatoryImportResult, SoilMeasurement, SoilMeasurementRequest,
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

  public analyzeExportPlanSchedule(request: ExportPlanScheduleAnalysisRequest): Observable<ExportPlanScheduleAnalysis> {
    return this.api.post<ExportPlanScheduleAnalysis>('/api/farm-owner/export-plans/schedule-analysis', request);
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

  public crops(admin = false, includeDeleted = false): Observable<MasterDataItem[]> {
    const query = admin && includeDeleted ? '?includeDeleted=true' : '';
    return this.api.get<MasterDataItem[]>(admin ? `/api/admin/crops${query}` : '/api/farm-owner/crops');
  }

  public destinations(admin = false, includeDeleted = false): Observable<MasterDataItem[]> {
    const query = admin && includeDeleted ? '?includeDeleted=true' : '';
    return this.api.get<MasterDataItem[]>(admin ? `/api/admin/destinations${query}` : '/api/farm-owner/destinations');
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

  public deleteCrop(id: number): Observable<MasterDataItem> {
    return this.api.delete<MasterDataItem>(`/api/admin/crops/${id}`);
  }

  public restoreCrop(id: number): Observable<MasterDataItem> {
    return this.api.post<MasterDataItem>(`/api/admin/crops/${id}/restore`, {});
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

  public deleteDestination(id: number): Observable<MasterDataItem> {
    return this.api.delete<MasterDataItem>(`/api/admin/destinations/${id}`);
  }

  public restoreDestination(id: number): Observable<MasterDataItem> {
    return this.api.post<MasterDataItem>(`/api/admin/destinations/${id}/restore`, {});
  }

  public statistics(): Observable<PlatformStatistics> {
    return this.api.get<PlatformStatistics>('/api/admin/statistics');
  }

  public admins(): Observable<AdminUser[]> { return this.api.get<AdminUser[]>('/api/admin/admins'); }
  public adminInvitations(): Observable<AdminInvitation[]> { return this.api.get<AdminInvitation[]>('/api/admin/admins/invitations'); }
  public inviteAdmin(body: { fullName: string; email: string }): Observable<void> { return this.api.post<void>('/api/admin/admins/invitations', body); }
  public resendAdminInvitation(id: number): Observable<void> { return this.api.post<void>(`/api/admin/admins/invitations/${id}/resend`, {}); }
  public revokeAdminInvitation(id: number): Observable<void> { return this.api.post<void>(`/api/admin/admins/invitations/${id}/revoke`, {}); }
  public setAdminActive(id: string, isActive: boolean): Observable<void> { return this.api.patch<void>(`/api/admin/admins/${id}/active`, { isActive }); }
  public downloadReport(params: Record<string, string>): Observable<Blob> { return this.api.getBlob('/api/farm-owner/reports/export?' + new URLSearchParams(params).toString()); }

  public farms(status?: 'Pending' | 'Active' | 'Inactive'): Observable<PagedResult<FarmAccount>> {
    return this.api.get<PagedResult<FarmAccount>>(`/api/admin/farms?pageSize=100${status ? `&status=${status}` : ''}`);
  }

  public approveFarm(id: number): Observable<FarmAccount> {
    return this.api.post<FarmAccount>(`/api/admin/farms/${id}/approve`, {});
  }

  public setFarmStatus(id: number, isActive: boolean): Observable<FarmAccount> {
    return this.api.patch<FarmAccount>(`/api/admin/farms/${id}/status`, { isActive });
  }

  public uploadActiveSubstances(regionName: string, file: File): Observable<RegulatoryImportResult> {
    const formData = new FormData();
    formData.append('RegionName', regionName);
    formData.append('File', file, file.name);
    return this.api.post<RegulatoryImportResult>('/api/admin/regulatory-data/active-substances', formData);
  }

  public uploadProductMrls(
    regionName: string,
    productType: string,
    file: File,
  ): Observable<RegulatoryImportResult> {
    const formData = new FormData();
    formData.append('RegionName', regionName);
    formData.append('ProductType', productType);
    formData.append('File', file, file.name);
    return this.api.post<RegulatoryImportResult>('/api/admin/regulatory-data/mrls', formData);
  }

  public ingestQualityStandard(file: File, crop: string, sourceName: string): Observable<RagIngestionResult> {
    const formData = new FormData();
    formData.append('File', file, file.name);
    formData.append('Crop', crop);
    formData.append('SourceName', sourceName);
    return this.api.post<RagIngestionResult>('/api/admin/rag/ingest/quality-standard', formData);
  }

  public ingestEuRegulationBody(file: File, sourceName: string): Observable<RagIngestionResult> {
    const formData = new FormData();
    formData.append('File', file, file.name);
    formData.append('SourceName', sourceName);
    return this.api.post<RagIngestionResult>('/api/admin/rag/ingest/eu-regulation-body', formData);
  }

  public ingestEuRegulationAnnex(
    file: File,
    sourceName: string,
    annexLabelHint: string,
    cropKeywordsCsv: string,
  ): Observable<RagIngestionResult> {
    const formData = new FormData();
    formData.append('File', file, file.name);
    formData.append('SourceName', sourceName);
    formData.append('AnnexLabelHint', annexLabelHint);
    formData.append('CropKeywordsCsv', cropKeywordsCsv);
    return this.api.post<RagIngestionResult>('/api/admin/rag/ingest/eu-regulation-annex', formData);
  }
}
