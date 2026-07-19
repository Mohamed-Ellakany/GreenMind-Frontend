import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Destination } from '../../shared/models/destination.model';
import { DestinationApiService } from './destination-api.service';

export interface DestinationUpsertRequest {
  name: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class AdminDestinationApiService {
  private readonly http = inject(HttpClient);
  private readonly destinationApiService = inject(DestinationApiService);

  listAll(): Observable<Destination[]> {
    // TODO: replace with a dedicated admin endpoint that also returns inactive items once the backend exposes one
    return this.destinationApiService.listActiveDestinations();
  }

  listActive(): Observable<Destination[]> {
    return this.destinationApiService.listActiveDestinations();
  }

  create(payload: DestinationUpsertRequest): Observable<Destination> {
    return this.http.post<Destination>(`${environment.apiBaseUrl}/admin/destinations`, payload);
  }

  update(
    destinationId: string,
    payload: DestinationUpsertRequest,
  ): Observable<Destination> {
    return this.http.put<Destination>(
      `${environment.apiBaseUrl}/admin/destinations/${destinationId}`,
      payload,
    );
  }

  deactivate(destinationId: string): Observable<Destination> {
    return this.http.patch<Destination>(
      `${environment.apiBaseUrl}/admin/destinations/${destinationId}/deactivate`,
      {},
    );
  }
}
