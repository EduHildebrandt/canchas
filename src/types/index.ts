export type BookingStatus =
  | 'HOLD'               // Bloqueado temporalmente (ej. 20 min) mientras se realiza el pago
  | 'PENDING_APPROVAL'  // Comprobante de transferencia cargado, a la espera de validación manual
  | 'CONFIRMED'         // Confirmado (seña o total abonado vía MP o aprobado por admin)
  | 'CANCELLED'         // Expirado por tiempo o cancelado
  | 'COMPLETED';        // Partido jugado y liquidado

export type PaymentStatus =
  | 'PENDING'           // Sin pago registrado
  | 'PARTIAL_PAID'      // Seña abonada (saldo restante pendiente en cancha)
  | 'PAID_FULL'         // 100% abonado
  | 'REFUNDED';         // Reembolsado

export type PaymentMethod =
  | 'MERCADOPAGO'
  | 'TRANSFERENCIA'
  | 'EFECTIVO';

export type PaymentType =
  | 'DEPOSIT_PARTIAL'   // Pago de seña
  | 'FULL_PAYMENT'      // Pago del 100% de la reserva
  | 'REMAINING_BALANCE'; // Pago del saldo restante en mostrador o link posterior

export interface CourtSettings {
  id: string;
  court_name: string;
  opening_time: string;          // Ej: "09:00"
  closing_time: string;          // Ej: "24:00"
  slot_duration_minutes: number; // Ej: 60
  day_price: number;             // Ej: 24000
  night_price: number;           // Ej: 30000
  night_start_time: string;      // Ej: "18:00"
  deposit_type: 'PERCENTAGE' | 'FIXED';
  deposit_value: number;         // Ej: 30 (30%) o 10000 ($10.000)
  bank_alias: string;
  bank_cbu: string;
  bank_holder: string;
  bank_name: string;
  hold_timeout_minutes: number;  // Ej: 20 minutos
  is_active: boolean;
}

export interface Booking {
  id: string;
  booking_number: string;        // Ej: "F5-1049"
  booking_date: string;          // YYYY-MM-DD
  start_time: string;            // HH:MM
  end_time: string;              // HH:MM
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  deposit_amount: number;        // Monto de seña calculado/requerido
  paid_amount: number;           // Monto efectivamente pagado a la fecha
  remaining_balance: number;     // Saldo restante por pagar
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod;
  expires_at?: string | null;    // ISO string para expiración del HOLD
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  payment_method: PaymentMethod;
  payment_type: PaymentType;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  mp_payment_id?: string | null;
  mp_preference_id?: string | null;
  receipt_url?: string | null;   // URL o Base64 del comprobante de transferencia
  rejection_reason?: string | null;
  created_at: string;
}

export interface TimeSlot {
  start_time: string;            // "18:00"
  end_time: string;              // "19:00"
  is_night: boolean;
  price: number;
  deposit_amount: number;
  is_available: boolean;
  status: 'AVAILABLE' | 'HOLD' | 'BOOKED' | 'PAST';
  booking?: Booking;
}
