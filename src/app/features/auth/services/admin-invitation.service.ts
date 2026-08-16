import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '@core/api/api-client.service';

@Injectable({ providedIn: 'root' })
export class AdminInvitationService {
    private readonly api = inject(ApiClient);

    public acceptInvitation(payload: { token: string; password: string }): Observable<void> {
        return this.api.post<void>('/api/admin-invitations/accept', payload);
    }
}
