export interface PlanNodeView {
  id: number;
  parent_id: number | null;
  titulo: string | null;
  nivel: number;
  orden: number | null;
  questions: Question[];
  children: PlanNodeView[];
}

export interface Question {
  id: number;
  question_text: string;
  order_index: number | null;
  is_required: boolean;
  answer: UserAnswer | null;
}

export interface UserAnswer {
  id: number;
  answer_text: string | null;
  files?: AnswerFile[];
  tables?: AnswerTable[];
}
export interface AnswerFile {
  id: number;
  answer_id: number;
  file_type: 'image' | 'document';
  file_path: string;
  original_name: string | null;
  mime_type: string | null;
  size: number | null;
  description: string | null;
  fuente: string | null;
  metadata: any | null;
  analysis: string | null;
  created_at: string;
}

export interface AnswerTable {
  id: number;
  answer_id: number;
  nombre: string;
  archivo_original: string | null;
  created_at: string;
  updated_at: string;
  data: any;
  fuente: string | null;
}
