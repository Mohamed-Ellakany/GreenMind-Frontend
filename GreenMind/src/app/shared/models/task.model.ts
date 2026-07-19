export type TaskStatus = 'Pending' | 'InProgress' | 'Completed' | 'Skipped';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Task {
  id: string;
  exportPlanId: string;
  taskTypeId: string;
  taskTypeName: string;
  title: string;
  description: string;
  plannedDate: string;
  actualDate: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  notes: string | null;
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus;
  actualDate?: string;
  notes?: string;
}
