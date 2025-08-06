// Types and interfaces for the dental clinic system

export type UserRole = 'admin' | 'auxiliar';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  permissions: string[];
}

export interface Professional {
  id: string;
  name: string;
  specialty: string;
  crm: string;
  phone: string;
  email: string;
  isActive: boolean;
  workSchedule: {
    [key: string]: { start: string; end: string; }[];
  };
  goals: {
    monthly: {
      appointments: number;
      revenue: number;
    };
  };
}

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  birthDate: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  isActive: boolean;
  lastVisit?: string;
  createdAt: string;
  promotions: Promotion[];
}

export interface Appointment {
  id: string;
  professionalId: string;
  patientId: string;
  date: string;
  time: string;
  duration: number;
  service: string;
  status: 'confirmado' | 'pendente' | 'cancelado' | 'realizado' | 'faltou';
  value: number;
  paymentType?: PaymentType;
  notes?: string;
  createdAt: string;
  confirmedAt?: string;
}

export type PaymentType = 'pix' | 'debito' | 'credito' | 'parcelado' | 'boleto' | 'dinheiro';

export interface Transaction {
  id: string;
  type: 'entrada' | 'saida';
  amount: number;
  description: string;
  category: string;
  paymentType: PaymentType;
  professionalId?: string;
  appointmentId?: string;
  date: string;
  createdAt: string;
  createdBy: string;
}

export interface CashRegister {
  id: string;
  date: string;
  openingAmount: number;
  closingAmount?: number;
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
  transactions: Transaction[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    byPaymentType: Record<PaymentType, number>;
    byProfessional: Record<string, number>;
  };
}

export interface Boleto {
  id: string;
  patientId: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  description: string;
  asaasId?: string;
  pixQrCode?: string;
  barCode?: string;
  createdAt: string;
  paidAt?: string;
}

export interface Promotion {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  description: string;
  isActive: boolean;
  validUntil?: string;
  appliedAt: string;
  appliedBy: string;
}

export interface Goal {
  id: string;
  professionalId?: string; // null for clinic-wide goals
  type: 'appointments' | 'revenue';
  period: 'monthly' | 'weekly';
  target: number;
  current: number;
  month: string;
  year: number;
}

export interface SystemSettings {
  clinicName: string;
  adminPhone: string;
  whatsappSettings: {
    apiKey?: string;
    templateIds: {
      confirmation: string;
      birthday: string;
      reminder: string;
      postAppointment: string;
      overdueBoleto: string;
    };
  };
  asaasSettings: {
    apiKey?: string;
    environment: 'sandbox' | 'production';
  };
  cashRegisterSettings: {
    requiresDailyClose: boolean;
    blockNextDayWithoutClose: boolean;
  };
  accessControl: {
    auxiliarPermissions: string[];
    adminPermissions: string[];
    dentistaPermissions: string[];
  };
}