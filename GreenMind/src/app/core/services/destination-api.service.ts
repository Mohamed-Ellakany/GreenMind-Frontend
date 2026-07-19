import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Destination } from '../../shared/models/destination.model';

@Injectable({ providedIn: 'root' })
export class DestinationApiService {
  private readonly http = inject(HttpClient);

  listActiveDestinations(): Observable<Destination[]> {
    return this.http.get<Destination[]>(`${environment.apiBaseUrl}/destinations`);
  }
}
