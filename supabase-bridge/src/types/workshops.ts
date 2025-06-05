export interface Workshop {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  capacity: number;
  date: string;
  location: string;
  active: boolean;
  image_url?: string;
  workshop_sessions?: WorkshopSession[];
}

export interface WorkshopSession {
  id: string;
  workshop_id: string;
  date: string;
  location: string;
  capacity: number;
  available_spots: number;
  active: boolean;
  workshops?: Workshop;
}

export interface WorkshopResponse {
  success: boolean;
  data?: Workshop | Workshop[];
  error?: string;
}

export interface WorkshopSessionResponse {
  success: boolean;
  data?: WorkshopSession | WorkshopSession[];
  error?: string;
}
