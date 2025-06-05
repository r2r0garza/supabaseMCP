export interface Event {
  id: string;
  workshop_id?: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  is_public: boolean;
  workshops?: any;
}

export interface EventResponse {
  success: boolean;
  data?: Event | Event[];
  error?: string;
}
