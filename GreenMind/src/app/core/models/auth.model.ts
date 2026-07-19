import { User } from './user.model';

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  farmName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
