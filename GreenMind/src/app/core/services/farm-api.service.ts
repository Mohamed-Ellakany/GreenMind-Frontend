import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Farm } from '../../shared/models/farm.model';

@Injectable({ providedIn: 'root' })
export class FarmApiService {
  private readonly http = inject(HttpClient);

  getMyFarm(): Observable<Farm> {
    return this.http.get<Farm>(`${environment.apiBaseUrl}/farm`);
  }
}
