export interface User {
  id?: number;
  name: string;
  last_name: string;
  email: string;
  password?: string;
  role_id: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserResponse {
  status: string;
  data: User[];
  message?: string;
}