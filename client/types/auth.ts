export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
  name?: string;
}

export interface User {
  id: string;
  email: string;
  username?: string | null;
  name?: string | null;
  avatar?: string | null;
  role?: string;
  authProvider?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  message: string;
  accessToken: string;
  user: User;
}
