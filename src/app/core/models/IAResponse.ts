export interface IaResponse {
  is_valid?: boolean;
  score?: number;
  feedback?: string | '';
  response?: string;
  images?: string[];
  references: Reference[] | null;
}

export interface Reference {
  authors: string[];
  title: string;
  year: string;
  source_type: string;
  url: string;
  apa_citation: string;
}