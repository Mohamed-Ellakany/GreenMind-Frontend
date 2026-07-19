import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Task, TaskPriority, TaskStatus, UpdateTaskStatusRequest } from '../../shared/models/task.model';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  taskTypeId?: string;
  from?: string;
  to?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskApiService {
  private readonly http = inject(HttpClient);

  list(exportPlanId: string, filters?: TaskFilters): Observable<Task[]> {
    let params = new HttpParams();

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value) {
          params = params.set(key, value);
        }
      }
    }

    return this.http.get<Task[]>(`${environment.apiBaseUrl}/export-plans/${exportPlanId}/tasks`, {
      params,
    });
  }

  getById(exportPlanId: string, taskId: string): Observable<Task> {
    return this.http.get<Task>(
      `${environment.apiBaseUrl}/export-plans/${exportPlanId}/tasks/${taskId}`,
    );
  }

  updateStatus(
    exportPlanId: string,
    taskId: string,
    payload: UpdateTaskStatusRequest,
  ): Observable<Task> {
    return this.http.patch<Task>(
      `${environment.apiBaseUrl}/export-plans/${exportPlanId}/tasks/${taskId}/status`,
      payload,
    );
  }
}
