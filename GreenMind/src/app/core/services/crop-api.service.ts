import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Crop } from '../../shared/models/crop.model';

@Injectable({ providedIn: 'root' })
export class CropApiService {
  private readonly http = inject(HttpClient);

  listActiveCrops(): Observable<Crop[]> {
    return this.http.get<Crop[]>(`${environment.apiBaseUrl}/crops`);
  }
}
