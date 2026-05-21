export interface IaResponse {
  is_valid?: boolean;
  score?: number;
  feedback?: string | '';
  response?: string;
  images?: string[];
}