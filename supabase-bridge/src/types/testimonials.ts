export interface Testimonial {
  id: string;
  user_id: string;
  workshop_id: string;
  content: string;
  rating: number;
  position?: string;
  company?: string;
  avatar_url?: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  tags?: string[];
  // Populated fields
  name?: string;
  workshopName?: string;
  email?: string;
  workshopId?: string;
  date?: string;
  featured?: boolean;
  approved?: boolean;
}

export interface TestimonialSubmitRequest {
  email: string;
  name: string;
  phone?: string;
  workshopId: string;
  content: string;
  position?: string;
  company?: string;
  rating: number;
}

export interface TestimonialResponse {
  success: boolean;
  data?: Testimonial | Testimonial[];
  error?: string;
}
