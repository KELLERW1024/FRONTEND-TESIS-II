export interface ChatResponse {
  is_valid: boolean;
  response: IaResponse;
  table: ChatTable | null;
  feedback?: string | '';
  image ?: IaImageResponse;
  message?: string | '';
  count_ia_image?: number;

}

export interface IaResponse {
  is_valid?: boolean;
  score?: number;
  feedback?: string | '';
  response?: string;
  images?: string[];
  references: Reference[] | null;
}
export interface IaImageResponse {
  id?: string  ;
  output: string[];
  
  status?: string;
} 

export interface Reference {
  authors: string[];
  title: string;
  year: string;
  source_type: string;
  url: string;
  apa_citation: string;
}

export interface ChatTable {
  title: string;
  columns: string[];
  rows: string[][];
}

