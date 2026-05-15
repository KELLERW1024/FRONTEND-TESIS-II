export interface Section {
  id: number;
  title: string;
  sub_title: string | null;
  description: string | null;
  order: number;
  progress: any,
  questions: any[]; // luego puedes tiparlo mejor
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
}

export interface Plan {
  id: number;
  name: string;
  code: string;
  price: string;
  billing_cycle: string;
  sections: Section[];
  description: string;
}