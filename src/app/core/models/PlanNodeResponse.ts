export interface PlanNode {
    id: number;
    user_plan_id: number | null;
    plan_id: number;
    parent_id: number | null;
    titulo: string;
    orden: number;
    objective: string | null;
    nivel: number;
    codigo: string | null;
    children?: PlanNode[];
}




