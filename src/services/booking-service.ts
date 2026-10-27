import { Booking, BookingStatus, Payment, PaymentMethod, PaymentStatus, PaymentType } from '@/types';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { getCourtSettings } from './court-service';

// Almacén en memoria de respaldo para desarrollo local / offline
const localBookingsCache = new Map<string, Booking>();
const localPaymentsCache = new Map<string, Payment[]>();

/**
 * Libera automáticamente reservas cuyo tiempo de bloqueo (HOLD) haya vencido
 */
export async function releaseExpiredHolds(): Promise<number> {
  const now = new Date();
  let releasedCount = 0;

  // 1. Limpieza en Supabase
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .update({
          status: 'CANCELLED',
          notes: 'Expirado automáticamente por tiempo sin pago.',
          updated_at: now.toISOString(),
        })
        .eq('status', 'HOLD')
        .lt('expires_at', now.toISOString())
        .select('id');

      if (!error && data) {
        releasedCount += data.length;
      }
    } catch (e) {
      console.warn('Error al ejecutar releaseExpiredHolds en Supabase:', e);
    }
  }

  // 2. Limpieza en cache local
  localBookingsCache.forEach((booking, id) => {
    if (booking.status === 'HOLD' && booking.expires_at) {
      const expires = new Date(booking.expires_at);
      if (expires < now) {
        booking.status = 'CANCELLED';
        booking.notes = (booking.notes ? booking.notes + ' ' : '') + '[Expirado automáticamente por tiempo sin pago]';
        booking.updated_at = now.toISOString();
        localBookingsCache.set(id, booking);
        releasedCount++;
      }
    }
  });

  return releasedCount;
}

export interface CreateHoldParams {
  bookingDate: string; // YYYY-MM-DD
  startTime: string;   // HH:MM
  endTime: string;     // HH:MM
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes?: string;
}

/**
 * Crea una reserva en estado 'HOLD' (bloqueo temporal de 20 min)
 * Garantiza control anti-colisión (evita doble turno)
 */
export async function createHoldBooking(params: CreateHoldParams): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  // 1. Liberar turnos expirados primero
  await releaseExpiredHolds();

  const settings = await getCourtSettings();

  // Validar si el turno ya está ocupado o bloqueado
  const activeBookings = await getBookingsForDate(params.bookingDate);
  const isConflict = activeBookings.some(
    (b) =>
      b.start_time === params.startTime &&
      ['HOLD', 'PENDING_APPROVAL', 'CONFIRMED', 'COMPLETED'].includes(b.status)
  );

  if (isConflict) {
    return {
      success: false,
      error: 'Lo sentimos, el turno seleccionado acaba de ser tomado o está bloqueado por otro usuario.',
    };
  }

  // Calcular precio según horario (diurno vs nocturno)
  const isNight = params.startTime >= settings.night_start_time;
  const totalAmount = isNight ? settings.night_price : settings.day_price;

  // Calcular seña requerida
  let depositAmount = 0;
  if (settings.deposit_type === 'PERCENTAGE') {
    depositAmount = Math.round((totalAmount * settings.deposit_value) / 100);
  } else {
    depositAmount = Math.min(settings.deposit_value, totalAmount);
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + settings.hold_timeout_minutes * 60 * 1000).toISOString();
  const bookingNumber = `F5-${Math.floor(1000 + Math.random() * 9000)}`;

  const newBooking: Booking = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `b-${Date.now()}`,
    booking_number: bookingNumber,
    booking_date: params.bookingDate,
    start_time: params.startTime,
    end_time: params.endTime,
    customer_name: params.customerName.trim(),
    customer_phone: params.customerPhone.trim(),
    customer_email: params.customerEmail.trim().toLowerCase(),
    total_amount: totalAmount,
    deposit_amount: depositAmount,
    paid_amount: 0,
    remaining_balance: totalAmount,
    status: 'HOLD',
    payment_status: 'PENDING',
    expires_at: expiresAt,
    notes: params.notes || null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  // Guardar en Supabase si está disponible
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          id: newBooking.id,
          booking_number: newBooking.booking_number,
          booking_date: newBooking.booking_date,
          start_time: newBooking.start_time,
          end_time: newBooking.end_time,
          customer_name: newBooking.customer_name,
          customer_phone: newBooking.customer_phone,
          customer_email: newBooking.customer_email,
          total_amount: newBooking.total_amount,
          deposit_amount: newBooking.deposit_amount,
          paid_amount: newBooking.paid_amount,
          remaining_balance: newBooking.remaining_balance,
          status: newBooking.status,
          payment_status: newBooking.payment_status,
          expires_at: newBooking.expires_at,
          notes: newBooking.notes,
        })
        .select()
        .single();

      if (error) {
        console.warn('Error insertando booking en Supabase, guardando localmente:', error);
      } else if (data) {
        newBooking.id = data.id;
      }
    } catch (e) {
      console.warn('Excepción insertando booking en Supabase:', e);
    }
  }

  // Guardar en cache local
  localBookingsCache.set(newBooking.id, newBooking);

  return { success: true, booking: newBooking };
}

/**
 * Obtiene todas las reservas para una fecha determinada
 */
export async function getBookingsForDate(dateStr: string): Promise<Booking[]> {
  await releaseExpiredHolds();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_date', dateStr)
        .in('status', ['HOLD', 'PENDING_APPROVAL', 'CONFIRMED', 'COMPLETED']);

      if (!error && data) {
        return data.map((b) => ({
          ...b,
          start_time: b.start_time.substring(0, 5),
          end_time: b.end_time.substring(0, 5),
          total_amount: Number(b.total_amount),
          deposit_amount: Number(b.deposit_amount),
          paid_amount: Number(b.paid_amount),
          remaining_balance: Number(b.remaining_balance),
        }));
      }
    } catch (e) {
      console.warn('Fallo consulta getBookingsForDate en Supabase:', e);
    }
  }

  const results: Booking[] = [];
  localBookingsCache.forEach((b) => {
    if (
      b.booking_date === dateStr &&
      ['HOLD', 'PENDING_APPROVAL', 'CONFIRMED', 'COMPLETED'].includes(b.status)
    ) {
      results.push(b);
    }
  });

  return results;
}

/**
 * Obtiene una reserva por su ID junto con su historial de pagos
 */
export async function getBookingById(id: string): Promise<{ booking: Booking | null; payments: Payment[] }> {
  await releaseExpiredHolds();

  let booking: Booking | null = null;
  let payments: Payment[] = [];

  if (supabase) {
    try {
      const { data: bData } = await supabase.from('bookings').select('*').eq('id', id).single();
      if (bData) {
        booking = {
          ...bData,
          start_time: bData.start_time.substring(0, 5),
          end_time: bData.end_time.substring(0, 5),
          total_amount: Number(bData.total_amount),
          deposit_amount: Number(bData.deposit_amount),
          paid_amount: Number(bData.paid_amount),
          remaining_balance: Number(bData.remaining_balance),
        };
      }

      const { data: pData } = await supabase.from('payments').select('*').eq('booking_id', id);
      if (pData) {
        payments = pData.map((p) => ({
          ...p,
          amount: Number(p.amount),
        }));
      }
    } catch (e) {
      console.warn('Fallo consulta getBookingById en Supabase:', e);
    }
  }

  if (!booking && localBookingsCache.has(id)) {
    booking = localBookingsCache.get(id) || null;
    payments = localPaymentsCache.get(id) || [];
  }

  return { booking, payments };
}

/**
 * Registra o actualiza el pago de una reserva (Acreditación Mercado Pago, Aprobación Transferencia o Cobro Mostrador)
 */
export async function applyBookingPayment({
  bookingId,
  amount,
  paymentMethod,
  paymentType,
  mpPaymentId,
  receiptUrl,
  status = 'APPROVED',
}: {
  bookingId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  mpPaymentId?: string;
  receiptUrl?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  const { booking } = await getBookingById(bookingId);
  if (!booking) {
    return { success: false, error: 'Reserva no encontrada' };
  }

  const newPayment: Payment = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}`,
    booking_id: bookingId,
    payment_method: paymentMethod,
    payment_type: paymentType,
    amount,
    status,
    mp_payment_id: mpPaymentId || null,
    receipt_url: receiptUrl || null,
    created_at: new Date().toISOString(),
  };

  // Si el pago es aprobado, actualizar montos y estados de la reserva
  if (status === 'APPROVED') {
    const updatedPaid = booking.paid_amount + amount;
    const remaining = Math.max(0, booking.total_amount - updatedPaid);
    const paymentStatus: PaymentStatus = remaining === 0 ? 'PAID_FULL' : 'PARTIAL_PAID';

    booking.paid_amount = updatedPaid;
    booking.remaining_balance = remaining;
    booking.payment_status = paymentStatus;
    booking.status = 'CONFIRMED';
    booking.payment_method = paymentMethod;
    booking.expires_at = null; // Quitar timer de expiración al estar confirmado
    booking.updated_at = new Date().toISOString();
  } else if (status === 'PENDING' && paymentMethod === 'TRANSFERENCIA') {
    // Si subió comprobante, pasa a PENDING_APPROVAL y extiende el bloqueo temporal para que el admin revise
    booking.status = 'PENDING_APPROVAL';
    booking.payment_method = 'TRANSFERENCIA';
    booking.updated_at = new Date().toISOString();
  }

  // Guardar en Supabase
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('payments').insert({
        id: newPayment.id,
        booking_id: newPayment.booking_id,
        payment_method: newPayment.payment_method,
        payment_type: newPayment.payment_type,
        amount: newPayment.amount,
        status: newPayment.status,
        mp_payment_id: newPayment.mp_payment_id,
        receipt_url: newPayment.receipt_url,
      });

      await supabaseAdmin
        .from('bookings')
        .update({
          paid_amount: booking.paid_amount,
          remaining_balance: booking.remaining_balance,
          payment_status: booking.payment_status,
          status: booking.status,
          payment_method: booking.payment_method,
          expires_at: booking.expires_at,
          updated_at: booking.updated_at,
        })
        .eq('id', booking.id);
    } catch (e) {
      console.warn('Error actualizando pago en Supabase:', e);
    }
  }

  // Actualizar cache local
  localBookingsCache.set(booking.id, booking);
  const currentPayments = localPaymentsCache.get(booking.id) || [];
  localPaymentsCache.set(booking.id, [...currentPayments, newPayment]);

  return { success: true, booking };
}
