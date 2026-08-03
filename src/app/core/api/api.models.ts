export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  validationErrors?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  succeeded: boolean;
  data: T;
  message: string | null;
  error: ApiError | null;
  traceId: string | null;
  timestamp: string;
}

export interface MasterDataItem {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  isDeleted: boolean;
  deletedAtUtc: string | null;
  createdAt: string;
}

export interface ExportPlan {
  id: number;
  name: string;
  crop: string;
  destination: string;
  plantingDate: string;
  expectedHarvestDate: string;
  expectedExportDate: string;
  status: string;
  planningStatus: PlanningStatusName;
  generatedTaskCount: number;
}

export interface ExportPlanDetails extends ExportPlan {
  cropId: number;
  destinationId: number;
  governorate: string;
  city: string;
  latitude: number;
  longitude: number;
  areaInFeddan: number;
  notes: string | null;
  planningFailureMessage: string | null;
}

export interface ExportPlanCreateRequest {
  name: string;
  cropId: number;
  destinationId: number;
  governorate: string;
  city: string;
  latitude: number;
  longitude: number;
  areaInFeddan: number;
  plantingDate: string;
  expectedHarvestDate: string;
  expectedExportDate: string;
  notes: string | null;
}

export interface SoilMeasurement {
  id: number;
  measurementDate: string;
  ph: number;
  ec: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  notes: string | null;
  createdAt: string;
}

export interface SoilMeasurementRequest {
  measurementDate: string;
  ph: number;
  ec: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  notes: string | null;
}

export type PlanningStatusName = 'Pending' | 'InProgress' | 'Succeeded' | 'Failed';

export interface PlanningStatus {
  exportPlanId: number;
  status: PlanningStatusName;
  attemptCount: number;
  generatedTaskCount: number;
  requestedAtUtc: string | null;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
  failureMessage: string | null;
}

export interface FarmTask {
  id: number;
  exportPlanId: number;
  taskTypeId: number;
  taskTypeName: string;
  title: string;
  description: string | null;
  plannedDate: string;
  actualDate: string | null;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  notes: string | null;
}

export interface ExportPlanDashboard {
  exportPlan: {
    id: number; name: string; status: string; crop: string; destination: string;
    governorate: string; city: string; areaInFeddan: number; plantingDate: string;
    expectedHarvestDate: string; expectedExportDate: string;
  };
  season: { currentSeasonDay: number; totalSeasonDays: number; progressPercentage: number; growthStage: string };
  latestSoilMeasurement: { measurementDate: string; ph: number; ec: number; nitrogen: number; phosphorus: number; potassium: number; moisture: number; notes: string | null } | null;
  taskSummary: { total: number; pending: number; inProgress: number; completed: number; cancelled: number };
  overdueTasks: DashboardTask[];
  upcomingTasks: DashboardTask[];
  completedTasks: DashboardTask[];
}

export interface DashboardTask {
  id: number; title: string; taskType: string; plannedDate: string;
  actualDate: string | null; status: string; priority: string;
}

export interface PlatformStatistics {
  totalFarms: number; pendingFarms: number; activeFarms: number; inactiveFarms: number;
  totalCrops: number; totalDestinations: number; totalExportPlans: number; totalTasks: number;
}

export interface FarmAccount {
  id: number; name: string; ownerUserId: string; ownerName: string; ownerEmail: string | null;
  isApproved: boolean; approvedAtUtc: string | null; isActive: boolean; createdAt: string;
}

export interface PagedResult<T> {
  items: T[]; pageNumber: number; pageSize: number; totalCount: number; totalPages: number;
}

export interface RegulatoryImportResult {
  message: string;
  importedRows: number;
  skippedRows: number;
}

export interface RagIngestionResult {
  chunksIngested: number;
}
