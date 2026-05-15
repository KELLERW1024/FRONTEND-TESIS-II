export interface ProgressItem {
  section_id: number;
  section_title: String;
  section_description: String;
  answer_text: string;
}

export interface ProgressResponse {
  data: ProgressItem[];
}