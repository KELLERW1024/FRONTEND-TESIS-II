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
  reference_warning?: string | null;
  // Alguna operación de la respuesta no se pudo calcular (CalculationService)
  calculation_warning?: string | null;
  unused_sources?: { apa_text: string; reason: string }[];
}
export interface IaImageResponse {
  id?: string  ;
  output: string[];
  
  status?: string;
  urls?: urls;
} 

export interface urls{
  cancel?: string;
  get?: string;
}

export interface Source extends Reference {
  excerpt?: string;
}

// Fuente citada en la respuesta. apa_text es el texto APA 7 que arma el backend para mostrarlo
export interface Reference {
  authors: string[];
  year: string;
  title: string;
  source_type: string;
  container_title?: string | null;
  volume?: string | null;
  issue?: string | null;
  pages?: string | null;
  publisher?: string | null;
  url?: string | null;
  doi?: string | null;
  in_text_citation?: string | null;
  apa_text?: string;
}

export interface ChatTable {
  title: string;
  columns: string[];
  rows: string[][];
}

