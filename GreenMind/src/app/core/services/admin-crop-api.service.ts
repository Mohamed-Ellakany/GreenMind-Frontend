import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Crop } from '../../shared/models/crop.model';
import { CropApiService } from './crop-api.service';

export interface CropUpsertRequest {
  name: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class AdminCropApiService {
  private readonly http = inject(HttpClient);
  private readonly cropApiService = inject(CropApiService);

  listAll(): Observable<Crop[]> {
    // TODO: replace with a dedicated admin endpoint that also returns inactive items once the backend exposes one
    return this.cropApiService.listActiveCrops();
  }

  listActive(): Observable<Crop[]> {
    return this.cropApiService.listActiveCrops();
  }

  create(payload: CropUpsertRequest): Observable<Crop> {
    return this.http.post<Crop>(`${environment.apiBaseUrl}/admin/crops`, payload);
  }

  update(cropId: string, payload: CropUpsertRequest): Observable<Crop> {
    return this.http.put<Crop>(`${environment.apiBaseUrl}/admin/crops/${cropId}`, payload);
  }

  deactivate(cropId: string): Observable<Crop> {
    return this.http.patch<Crop>(`${environment.apiBaseUrl}/admin/crops/${cropId}/deactivate`, {});
  }
}
