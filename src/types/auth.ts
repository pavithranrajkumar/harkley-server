// Auth request/response types
export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  token: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Supabase user type
export interface SupabaseUser {
  id: string;
  email: string;
  role?: string;
}
