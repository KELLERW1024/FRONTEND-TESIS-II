export interface PaymentResponse {
  status: 'approved' | 'rejected' | 'in_process' | string;
  status_detail: string;
  id: number;
  date_approved: string | null;

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