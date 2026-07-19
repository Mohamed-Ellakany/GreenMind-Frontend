export type UserRole = 'FarmOwner' | 'PlatformAdmin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
}
