export interface Boleto
{
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX';
  value: number;
  netValue: number;
  originalValue?: number;
  dueDate: string;
  paymentDate?: string;
  invoiceUrl: string;
  bankSlipUrl: string;
  status: 'pago' | 'pendente' | 'vencido'; 
  description?: string;
  externalReference?: string;
  postalService?: boolean;
  clientPaymentDate?: string;
}