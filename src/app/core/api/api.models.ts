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

export interface SoilAnalysisSummary {
  ph: number | null;
  ec: number | null;
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
  organicMatter: number | null;
  isCompleted: boolean;
}

export interface WaterAnalysisSummary {
  ph: number | null;
  ec: number | null;
  salinity: number | null;
  sodium: number | null;
  chloride: number | null;
  bicarbonate: number | null;
  calcium: number | null;
  magnesium: number | null;
  sar: number | null;
  isCompleted: boolean;
}

export interface FarmDataSummary {
  farmType?: string | null;
  soilType?: string | null;
  irrigationSystem?: string | null;
  fertigation?: string | null;
  soilPh?: number | null;
  soilEc?: number | null;
  soilNitrogen?: number | null;
  soilPhosphorus?: number | null;
  soilPotassium?: number | null;
  soilOrganicMatter?: number | null;
  waterPh?: number | null;
  waterEc?: number | null;
  waterSalinity?: number | null;
  waterSodium?: number | null;
  waterChloride?: number | null;
  waterBicarbonate?: number | null;
  waterCalcium?: number | null;
  waterMagnesium?: number | null;
  waterSar?: number | null;
}

export interface ExportPlanFarmDataUpdateRequest {
  farmType?: string | null;
  soilType?: string | null;
  soilPh?: number | null;
  soilEc?: number | null;
  soilNitrogen?: number | null;
  soilPhosphorus?: number | null;
  soilPotassium?: number | null;
  soilOrganicMatter?: number | null;
  waterPh?: number | null;
  waterEc?: number | null;
  waterSalinity?: number | null;
  waterSodium?: number | null;
  waterChloride?: number | null;
  waterBicarbonate?: number | null;
  waterCalcium?: number | null;
  waterMagnesium?: number | null;
  waterSar?: number | null;
  irrigationSystem?: string | null;
  fertigation?: string | null;
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
  isFarmDataReady?: boolean;
  isSoilAnalysisCompleted?: boolean;
  isWaterAnalysisCompleted?: boolean;
  farmType?: string | null;
  soilType?: string | null;
  irrigationSystem?: string | null;
  farmData?: FarmDataSummary | null;
}

export interface ExportPlanDetails extends ExportPlan {
  cropId: number;
  supportsSmartDiagnosis: boolean;
  destinationId: number;
  governorate: string;
  city: string;
  latitude: number;
  longitude: number;
  areaInFeddan: number;
  notes: string | null;
  planningFailureMessage: string | null;
  farmType?: string | null;
  soilType?: string | null;
  soilPh?: number | null;
  soilEc?: number | null;
  soilNitrogen?: number | null;
  soilPhosphorus?: number | null;
  soilPotassium?: number | null;
  soilOrganicMatter?: number | null;
  waterPh?: number | null;
  waterEc?: number | null;
  waterSalinity?: number | null;
  waterSodium?: number | null;
  waterChloride?: number | null;
  waterBicarbonate?: number | null;
  waterCalcium?: number | null;
  waterMagnesium?: number | null;
  waterSar?: number | null;
  irrigationSystem?: string | null;
  fertigation?: string | null;
  soilAnalysis?: SoilAnalysisSummary | null;
  waterAnalysis?: WaterAnalysisSummary | null;
  farmData?: FarmDataSummary | null;
  isSoilAnalysisCompleted?: boolean;
  isWaterAnalysisCompleted?: boolean;
  isFarmDataReady?: boolean;
  farmDataCompletedCount?: number;
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
  analysisToken: string;
  acceptScheduleWarnings: boolean;
  farmType?: string | null;
  soilType?: string | null;
  soilPh?: number | null;
  soilEc?: number | null;
  soilNitrogen?: number | null;
  soilPhosphorus?: number | null;
  soilPotassium?: number | null;
  soilOrganicMatter?: number | null;
  waterPh?: number | null;
  waterEc?: number | null;
  waterSalinity?: number | null;
  waterSodium?: number | null;
  waterChloride?: number | null;
  waterBicarbonate?: number | null;
  waterCalcium?: number | null;
  waterMagnesium?: number | null;
  waterSar?: number | null;
  irrigationSystem?: string | null;
  fertigation?: string | null;
}

export interface ExportPlanScheduleAnalysisRequest {
  name: string;
  cropId: number;
  destinationId: number;
  governorate: string;
  city: string;
  latitude: number;
  longitude: number;
  areaInFeddan: number;
  notes: string | null;
  plantingDate?: string;
  expectedHarvestDate?: string;
  expectedExportDate?: string;
}

export interface ScheduleAnalysisSource {
  id: string;
  title: string;
  publisher: string;
  url: string | null;
  retrievedAtUtc: string;
  evidenceKind: 'OfficialSource' | 'FarmHistory' | 'AiInference';
  supportedFacts: string[];
}

export interface ScheduleInferredFact {
  field: string;
  value: string;
  reason: string;
}

export interface ExportPlanScheduleAnalysis {
  seasonName: string;
  plantingDate: string;
  expectedHarvestDate: string;
  expectedExportDate: string;
  assessment: 'Feasible' | 'AtRisk' | 'NotRecommended';
  confidence: 'High' | 'Medium' | 'Low';
  summary: string;
  reasons: string[];
  warnings: string[];
  recommendations: string[];
  assumptions: string[];
  sources: ScheduleAnalysisSource[];
  inferredFacts: ScheduleInferredFact[];
  analysisToken: string;
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
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled' | 'Postponed' | 'Skipped';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  origin: 'AIPlanned' | 'UserAdded' | 'AIReplanned';
  notes: string | null;
  activities?: TaskActivity[];
}

export interface TaskActivity {
  id: number;
  eventType: string;
  source: string;
  actorName: string | null;
  previousStatus: FarmTask['status'] | null;
  newStatus: FarmTask['status'] | null;
  previousPlannedDate: string | null;
  newPlannedDate: string | null;
  actualDate: string | null;
  note: string | null;
  createdAt: string;
}

export interface TaskType {
  id: number;
  name: string;
  description: string | null;
}

export interface CreateTaskRequest {
  exportPlanId: number;
  taskTypeId: number;
  title: string;
  description: string | null;
  quantity: number;
  unit: string;
  plannedDate: string;
  actualDate: string | null;
  status: FarmTask['status'];
  priority: FarmTask['priority'];
  notes: string | null;
}

export interface ScheduleRevision {
  id: number;
  exportPlanId: number;
  status: 'Pending' | 'InProgress' | 'Succeeded' | 'Failed' | 'Superseded';
  source: string;
  createdAt: string;
  startedAtUtc: string | null;
  completedAtUtc: string | null;
  attemptCount: number;
  failureMessage: string | null;
  items: ScheduleRevisionItem[];
}

export interface ScheduleRevisionItem {
  id: number;
  farmTaskId: number | null;
  operation: 'Added' | 'Moved' | 'Cancelled';
  taskTitle: string;
  previousPlannedDate: string | null;
  newPlannedDate: string | null;
  reason: string | null;
}

export interface ExportPlanDashboard {
  exportPlan: {
    id: number; name: string; status: string; crop: string; destination: string;
    governorate: string; city: string; areaInFeddan: number; plantingDate: string;
    expectedHarvestDate: string; expectedExportDate: string;
  };
  season: { currentSeasonDay: number; totalSeasonDays: number; progressPercentage: number; growthStage: string };
  todayWeather: DashboardWeather | null;
  latestSoilMeasurement: { measurementDate: string; ph: number; ec: number; nitrogen: number; phosphorus: number; potassium: number; moisture: number; notes: string | null } | null;
  taskSummary: { total: number; pending: number; inProgress: number; completed: number; cancelled: number; postponed?: number; skipped?: number };
  overdueTasks: DashboardTask[];
  upcomingTasks: DashboardTask[];
  completedTasks: DashboardTask[];
}

export interface DashboardTask {
  id: number; title: string; taskType: string; plannedDate: string;
  actualDate: string | null; status: FarmTask['status'] | string; priority: string;
  description?: string | null; notes?: string | null; origin?: FarmTask['origin'] | string;
}

export interface DashboardWeather {
  date: string;
  tempMinC: number;
  tempMaxC: number;
  precipitationMm: number;
  humidityPercent: number;
  windSpeedKmh: number;
}

export interface PlatformStatistics {
  totalFarms: number; pendingFarms: number; activeFarms: number; inactiveFarms: number;
  totalCrops: number; totalDestinations: number; totalExportPlans: number; totalTasks: number;
  exportPlansByCrop: { id: number; name: string; exportPlanCount: number }[];
  exportPlansByDestination: { id: number; name: string; exportPlanCount: number }[];
  farmRegistrationsByMonth: NamedCount[]; exportPlansByStatus: NamedCount[]; tasksByStatus: NamedCount[];
}
export interface NamedCount { name: string; count: number; }
export interface AdminUser { id: string; fullName: string; email: string; isActive: boolean; isSuperAdmin: boolean; }
export interface AdminInvitation { id: number; fullName: string; email: string; expiresAtUtc: string; acceptedAtUtc: string | null; revokedAtUtc: string | null; }

export interface FarmAccount {
  id: number; name: string; ownerUserId: string; ownerName: string; ownerEmail: string | null;
  isApproved: boolean; approvedAtUtc: string | null; isActive: boolean; createdAt: string; isAiAccessSuspended: boolean;
}

export interface AiUsageTotals {
  requestCount: number; inputTokens: number; outputTokens: number; totalTokens: number;
  estimatedCostUsd: number; actualCostUsd: number; fallbackCount: number;
}
export interface AiUsageDaily { date: string; requestCount: number; totalTokens: number; actualCostUsd: number; }
export interface AiUsageBreakdown { key: string; requestCount: number; totalTokens: number; actualCostUsd: number; }
export interface AiUsageByUser {
  userId: string | null; userName: string; email: string | null; farmName: string | null;
  requestCount: number; totalTokens: number; actualCostUsd: number;
}
export interface AiUsageRequest {
  id: number; providerRequestId: string; userId: string | null; userName: string | null; farmName: string | null;
  exportPlanId: number | null; exportPlanName: string | null; feature: string; modelId: string; region: string | null;
  inputTokens: number; outputTokens: number; totalTokens: number; stopReason: string | null; budgetState: string | null;
  fallbackUsed: boolean; estimatedCostUsd: number; actualCostUsd: number; providerStatus: string; completedAtUtc: string;
}
export interface AdminAiUsageOverview {
  totals: AiUsageTotals; dailyUsage: AiUsageDaily[]; usageByModel: AiUsageBreakdown[];
  usageByFeature: AiUsageBreakdown[]; usageByUser: AiUsageByUser[]; requests: PagedResult<AiUsageRequest>;
}
export interface AdminUserProfile {
  id: string; fullName: string; userName: string | null; email: string | null; emailConfirmed: boolean;
  phoneNumber: string | null; phoneNumberConfirmed: boolean; twoFactorEnabled: boolean; isActive: boolean;
  isAiAccessSuspended: boolean; lockoutEndUtc: string | null; registeredAtUtc: string | null;
}
export interface AdminFarmDetails {
  id: number; name: string; isApproved: boolean; approvedAtUtc: string | null; createdAt: string; exportPlanCount: number;
}
export interface AdminExportPlanDetails {
  id: number; farmId: number; farmName: string; name: string; crop: string; destination: string; governorate: string; city: string;
  latitude: number; longitude: number; areaInFeddan: number; plantingDate: string; expectedHarvestDate: string;
  expectedExportDate: string; status: string; notes: string | null; planningStatus: string;
  planningRequestedAtUtc: string | null; planningStartedAtUtc: string | null; planningCompletedAtUtc: string | null;
  planningAttemptCount: number; generatedTaskCount: number; planningFailureMessage: string | null;
  taskCount: number; diseaseReportCount: number; createdAt: string;
}
export interface AdminUserDetails {
  user: AdminUserProfile; farms: AdminFarmDetails[]; exportPlans: AdminExportPlanDetails[];
  aiUsage: {
    totals: AiUsageTotals; dailyUsage: AiUsageDaily[]; usageByModel: AiUsageBreakdown[];
    usageByFeature: AiUsageBreakdown[]; requests: PagedResult<AiUsageRequest>;
  };
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

export type SupportMessageRole = 'Customer' | 'Admin';

export interface SupportConversation {
  id: number;
  farmId: number;
  farmName: string;
  ownerName: string;
  ownerEmail: string | null;
  isClosed: boolean;
  lastMessageAtUtc: string;
  lastAdminReplyAtUtc: string | null;
  lastCustomerMessageAtUtc: string | null;
  lastMessagePreview: string | null;
}

export interface SupportMessage {
  id: number;
  conversationId: number;
  role: SupportMessageRole;
  senderUserId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface SupportMessagePage {
  items: SupportMessage[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
}

export interface UserBudgetStatus {
  limitUsd: number;
  usedUsd: number;
  isExceeded: boolean;
  hasPendingRequest: boolean;
}

export type AiLimitRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface AiLimitRequestItem {
  id: number;
  userId: string;
  userFullName: string;
  userEmail: string | null;
  contactName: string;
  contactPhone: string;
  currentLimitUsd: number;
  usedUsd: number;
  status: AiLimitRequestStatus;
  adminNote: string | null;
  newLimitUsd: number | null;
  requestedAtUtc: string;
  resolvedAtUtc: string | null;
}

