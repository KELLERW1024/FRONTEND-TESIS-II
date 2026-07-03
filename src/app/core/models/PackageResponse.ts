
export interface PackageResponse {
  success: boolean;
  data: Package[];
}

export interface Package {
  id: number;
  name: string;
  description: string;
  duration_months: number;

  local_price: string;
  international_price: string;
  unit_price: string;

  benefits: string;

  num_plans: number;
  is_active: number; // o boolean si lo conviertes
}