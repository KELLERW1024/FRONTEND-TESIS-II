export interface ConversationsPaymentsResponse {
  user: User;
  conversations: ConversationItem[];
}

export interface ConversationItem {
  id: number;
  user: User;
  status: ConversationStatus;
  title: string;
  plan_name: string;
  payment_status: PaymentStatus | null;
}

export interface User {
  id: number;
  name: string;
}

export type ConversationStatus = 'active' | 'completed' | 'archived';

export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refunded';