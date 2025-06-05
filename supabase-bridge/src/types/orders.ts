export interface Order {
  id: string;
  user_id: string;
  workshop_id: string;
  session_id?: string;
  payment_method: string;
  payment_id?: string;
  amount: number;
  status: string;
  created_at: string;
  workshops?: any;
  sessions?: any;
}

export interface OrderCreateRequest {
  user_id: string;
  workshop_id: string;
  session_id?: string;
  payment_method: string;
  payment_id?: string;
  amount: number;
}

export interface OrderStatusUpdateRequest {
  status: string;
  payment_id?: string;
}

export interface OrderResponse {
  success: boolean;
  data?: Order | Order[];
  error?: string;
}
