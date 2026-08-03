import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
@Component({ selector: 'app-accept-invitation', imports: [FormsModule], templateUrl: './accept-invitation.html' })
export class AcceptInvitation {
  private http = inject(HttpClient); private route = inject(ActivatedRoute); private router = inject(Router); public password = ''; public error = signal('');
  public submit(): void { const token = this.route.snapshot.queryParamMap.get('token'); if (!token) { this.error.set('رابط الدعوة غير صالح.'); return; } this.http.post('/api/admin-invitations/accept', { token, password: this.password }).subscribe({ next: () => this.router.navigate(['/auth/login']), error: () => this.error.set('تعذر قبول الدعوة. تأكد من صلاحية الرابط وكلمة المرور.') }); }
}
