export interface ConversationPlanResponse {
  completed: boolean;
  plan_name: string;
  node: PlanNode | null;
  parent_node: PlanNode | null;
  question: PlanQuestion | null;
  // Si se puede usar "Volver a la pregunta anterior" desde esta pregunta
  go_back?: { allowed: boolean; reason: string | null };
  // Lo recuperado al volver a esta pregunta (primer cuadro, tabla y nombres de archivos)
  restored?: RestoredAnswer;
}

export interface RestoredAnswer {
  user_input: string;
  table: { title: string; columns: string[]; rows: any[][] } | null;
  files: string[];
}

export interface PlanNode {
  id: number;
  user_plan_id: number;
  plan_id: number;
  parent_id: number | null;
  titulo: string;
  // Agrega aquí los demás campos que realmente devuelve tu API
}

export interface PlanQuestion {
  id: number;
  plan_node_id: number;
  question_text: string;
  question_detail: string;
  question_example: string;
  validation_detail: string;

  // Agrega aquí los demás campos que devuelve tu API
}
