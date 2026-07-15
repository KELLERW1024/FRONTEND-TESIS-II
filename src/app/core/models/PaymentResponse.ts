export interface PaymentResponse {
  status: string;
  status_detail: string;
  id: number;
  payment_id: number;
  amount: number;
  date_approved: string | null;
  subscription_id: number;
  conversation_ids: number[] ;

  payer: {
    email?: string;
    id?: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };

  payment_method_id: string;
  payment_type_id: string;

  refunds: any[];

  // por si Mercado Pago agrega más campos
  [key: string]: any;
}