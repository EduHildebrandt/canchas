import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getBookingById, applyBookingPayment } from '@/services/booking-service';
import { getCourtSettings } from '@/services/court-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, bookingId } = body;

    if (!action) {
      return NextResponse.json({ success: false, error: 'Acción no especificada' }, { status: 400 });
    }

    // 1. Aprobar Comprobante de Transferencia
    if (action === 'APPROVE_TRANSFER') {
      const { booking, payments } = await getBookingById(bookingId);
      if (!booking) {
        return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
      }

      const pendingPayment = payments.find((p) => p.status === 'PENDING');
      const amountToApprove = pendingPayment ? pendingPayment.amount : booking.deposit_amount;

      await applyBookingPayment({
        bookingId: booking.id,
        amount: amountToApprove,
        paymentMethod: 'TRANSFERENCIA',
        paymentType: amountToApprove >= booking.total_amount ? 'FULL_PAYMENT' : 'DEPOSIT_PARTIAL',
        status: 'APPROVED',
      });

      return NextResponse.json({ success: true, message: 'Transferencia aprobada con éxito.' });
    }

    // 2. Rechazar Comprobante de Transferencia
    if (action === 'REJECT_TRANSFER') {
      const { booking } = await getBookingById(bookingId);
      if (!booking) {
        return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
      }

      const reason = body.reason || 'Comprobante rechazado por administración';

      if (supabaseAdmin) {
        await supabaseAdmin
          .from('bookings')
          .update({
            status: 'CANCELLED',
            notes: (booking.notes ? booking.notes + ' ' : '') + `[Rechazado: ${reason}]`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);

        await supabaseAdmin
          .from('payments')
          .update({ status: 'REJECTED', rejection_reason: reason })
          .eq('booking_id', booking.id)
          .eq('status', 'PENDING');
      }

      booking.status = 'CANCELLED';
      return NextResponse.json({ success: true, message: 'Comprobante rechazado y turno liberado.' });
    }

    // 3. Cobrar Saldo en Mostrador (Efectivo / Débito)
    if (action === 'COLLECT_BALANCE') {
      const { booking } = await getBookingById(bookingId);
      if (!booking) {
        return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
      }

      const amountToCollect = Number(body.amount) || booking.remaining_balance;
      if (amountToCollect <= 0) {
        return NextResponse.json({ success: false, error: 'La reserva ya no posee saldo pendiente.' }, { status: 400 });
      }

      await applyBookingPayment({
        bookingId: booking.id,
        amount: amountToCollect,
        paymentMethod: 'EFECTIVO',
        paymentType: 'REMAINING_BALANCE',
        status: 'APPROVED',
      });

      return NextResponse.json({ success: true, message: `Saldo de $${amountToCollect} cobrado exitosamente.` });
    }

    // 4. Cancelar Reserva Manualmente
    if (action === 'CANCEL_BOOKING') {
      const { booking } = await getBookingById(bookingId);
      if (!booking) {
        return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
      }

      if (supabaseAdmin) {
        await supabaseAdmin
          .from('bookings')
          .update({
            status: 'CANCELLED',
            notes: (booking.notes ? booking.notes + ' ' : '') + '[Cancelado por el Administrador]',
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.id);
      }

      booking.status = 'CANCELLED';
      return NextResponse.json({ success: true, message: 'Turno cancelado y liberado.' });
    }

    // 5. Crear Reserva Directa desde el Mostrador
    if (action === 'MANUAL_BOOKING') {
      const {
        bookingDate,
        startTime,
        endTime,
        customerName,
        customerPhone,
        paymentOption, // 'NONE' | 'DEPOSIT_CASH' | 'FULL_CASH'
        notes,
      } = body;

      const settings = await getCourtSettings();
      const isNight = startTime >= settings.night_start_time;
      const totalAmount = isNight ? settings.night_price : settings.day_price;

      let depositAmount = 0;
      if (settings.deposit_type === 'PERCENTAGE') {
        depositAmount = Math.round((totalAmount * settings.deposit_value) / 100);
      } else {
        depositAmount = Math.min(settings.deposit_value, totalAmount);
      }

      let paidAmount = 0;
      let paymentStatus = 'PENDING';
      let paymentMethod = 'EFECTIVO';

      if (paymentOption === 'DEPOSIT_CASH') {
        paidAmount = depositAmount;
        paymentStatus = 'PARTIAL_PAID';
      } else if (paymentOption === 'FULL_CASH') {
        paidAmount = totalAmount;
        paymentStatus = 'PAID_FULL';
      }

      const remainingBalance = Math.max(0, totalAmount - paidAmount);
      const bookingNumber = `F5-${Math.floor(1000 + Math.random() * 9000)}`;
      const now = new Date();

      const newBooking = {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `b-${Date.now()}`,
        booking_number: bookingNumber,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: 'mostrador@cancha.com',
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        paid_amount: paidAmount,
        remaining_balance: remainingBalance,
        status: 'CONFIRMED', // Las reservas de mostrador se confirman directamente
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        notes: notes ? `[Mostrador] ${notes}` : '[Reserva presencial / telefónica]',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      if (supabaseAdmin) {
        await supabaseAdmin.from('bookings').insert(newBooking);
        if (paidAmount > 0) {
          await supabaseAdmin.from('payments').insert({
            booking_id: newBooking.id,
            payment_method: 'EFECTIVO',
            payment_type: paidAmount >= totalAmount ? 'FULL_PAYMENT' : 'DEPOSIT_PARTIAL',
            amount: paidAmount,
            status: 'APPROVED',
          });
        }
      }

      return NextResponse.json({ success: true, booking: newBooking });
    }

    return NextResponse.json({ success: false, error: 'Acción no reconocida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error en /api/admin/bookings/action:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
