export interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
}

export interface PendingUserCreateRequest {
  email: string;
  full_name: string;
  phone?: string;
}

export interface PendingUserResponse {
  success: boolean;
  data?: PendingUser | PendingUser[];
  error?: string;
}
