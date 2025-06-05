export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
}

export interface UserCreateRequest {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role?: string;
}

export interface UserUpdateRequest {
  full_name?: string;
  phone?: string;
  role?: string;
}

export interface UserIdResponse {
  id: string;
}

export interface UserProfileResponse {
  success: boolean;
  data?: UserProfile;
  error?: string;
}
