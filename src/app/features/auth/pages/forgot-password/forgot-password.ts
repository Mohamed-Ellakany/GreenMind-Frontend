import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/AuthService';
@Component({selector:'app-forgot-password',imports:[FormsModule,RouterLink],template:`<main class="min-h-dvh grid place-items-center bg-[#f4f7f4] p-6" dir="rtl"><form class="w-full max-w-md rounded-3xl bg-white p-8 shadow" (ngSubmit)="submit()"><h1 class="text-2xl font-black">نسيت كلمة المرور؟</h1><input class="mt-6 h-12 w-full rounded-xl border px-4" type="email" name="email" [(ngModel)]="email" required placeholder="البريد الإلكتروني" dir="ltr"><button class="mt-4 h-12 w-full rounded-xl bg-[#0f7a3d] font-bold text-white">إرسال الرابط</button>@if(message()){<p class="mt-4 text-sm text-[#0f7a3d]">{{message()}}</p>}<a class="mt-6 block text-center text-sm text-[#0f7a3d]" routerLink="/auth/login">العودة</a></form></main>`})
export class ForgotPassword { private readonly auth=inject(AuthService); protected email=''; protected message=signal(''); submit(){this.auth.forgotPassword(this.email).subscribe(()=>this.message.set('تم إرسال الرابط إذا كان البريد مسجلًا.'));} }
