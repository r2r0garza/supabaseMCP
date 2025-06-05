export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      [key: string]: any;
    };
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      [key: string]: any;
    };
  };
  error?: string;
}

export interface PasswordResetRequest {
  email: string;
  redirect_to: string;
}

export interface PasswordUpdateRequest {
  password: string;
}
