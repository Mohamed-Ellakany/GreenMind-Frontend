import { SoilMeasurement } from './soil-measurement.model';
import { Task } from './task.model';

export type ExportPlanStatus = 'Draft' | 'Active' | 'Completed' | 'Cancelled';

export interface ExportPlan {
  id: string;
  farmId: string;
  cropId: string;
  destinationId: string;
  name: string;
  governorate: string;
  city: string;
  latitude: number;
  longitude: number;
  areaInFeddan: number;
  plantingDate: string;
  expectedHarvestDate: string;
  expectedExportDate: string;
  status: ExportPlanStatus;
  notes: string | null;
  createdAt: string;
}

export interface CreateExportPlanRequest {
  cropId: string;
  destinationId: string;
  name: string;
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

export interface ExportPlanDashboard {
  cropName: string;
  destinationName: string;
  currentSeasonDay: number;
  seasonProgressPercent: number;
  growthStage: string;
  latestSoilMeasurement: SoilMeasurement | null;
  taskSummary: {
    pending: number;
    inProgress: number;
    completed: number;
    skipped: number;
  };
  upcomingTasks: Task[];
  completedTasks: Task[];
}
