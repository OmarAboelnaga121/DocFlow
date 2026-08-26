export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  name?: string;
  avatar?: File | null;
}

export type UserRole = "DEVELOPER" | "BUSINESS" | "USER";

export interface User {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  avatar?: string | null;
  userRole?: UserRole | string;
  role?: UserRole | string;
  authProvider?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
}

