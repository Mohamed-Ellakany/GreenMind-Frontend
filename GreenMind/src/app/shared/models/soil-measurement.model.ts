export interface SoilMeasurement {
  id: string;
  exportPlanId: string;
  measurementDate: string;
  ph: number;
  ec: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  notes: string | null;
}

export interface CreateSoilMeasurementRequest {
  measurementDate: string;
  ph: number;
  ec: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  moisture: number;
  notes: string | null;
}
