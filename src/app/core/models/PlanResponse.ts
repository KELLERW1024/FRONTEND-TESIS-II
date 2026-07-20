export interface Section {
  id: number;
  title: string;
  sub_title: string | null;
  description: string | null;
  order: number;
  progress: any,
  questions: Question[]; // luego puedes tiparlo mejor
  answer: string | null;
}
export interface Question {
  id: number;
  text: string;
  detail: string;
  evidence: string;
  validation: string;
  apa: string;
  type: string;
  image: number;
  answer_question : string;
  tables?: Table[];
   files?: FileQuestion[];
}

export interface Plan {
  id: number;
  name: string;
  code: string;
  price: number;
  billing_cycle: string;
  sections: Section[];
  description: string;
}

export interface Table {
  title: string;
  data: {
    columns: string[];
    rows: any[][];
  };
  numero?: number;
}

export interface FileQuestion {
  file_type: string;
  file_url: string;
  description?: string;
  fuente?: string;
  numero?: number;
}