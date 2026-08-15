export interface ConversationPlanResponse {
  completed: boolean;
  plan_name: string;
  node: PlanNode | null;
  parent_node: PlanNode | null;
  question: PlanQuestion | null;
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
