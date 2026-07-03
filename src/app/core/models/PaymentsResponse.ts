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
  payments: Payments[] ;
}

export interface User {
  id: number;
  name: string;
}

export type ConversationStatus = 'active' | 'completed' | 'archived';

export interface Payments{
  status: string;
}