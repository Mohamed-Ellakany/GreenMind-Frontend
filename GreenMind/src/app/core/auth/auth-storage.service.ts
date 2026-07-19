import { Injectable } from '@angular/core';

import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  private readonly tokenKey = 'greenmind.auth.token';
  private readonly userKey = 'greenmind.auth.user';

  getToken(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    sessionStorage.setItem(this.tokenKey, token);
  }

  getUser(): User | null {
    const serializedUser = sessionStorage.getItem(this.userKey);

    if (!serializedUser) {
      return null;
    }

    try {
      return JSON.parse(serializedUser) as User;
    } catch {
      sessionStorage.removeItem(this.userKey);
      return null;
    }
  }

  setUser(user: User): void {
    sessionStorage.setItem(this.userKey, JSON.stringify(user));
  }

  clear(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
  }
}
