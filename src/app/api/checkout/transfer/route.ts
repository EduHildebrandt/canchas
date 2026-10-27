import { NextRequest, NextResponse } from 'next/server';
import { getBookingById, applyBookingPayment } from '@/services/booking-service';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, paymentType, receiptUrl } = await request.json();

    if (!bookingId || !paymentType) {
      return NextResponse.json({ success: false, error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    const { booking } = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
    }

    const isPartial = paymentType === 'DEPOSIT_PARTIAL';
    const amountDeclared = isPartial ? booking.deposit_amount : booking.total_amount;

    // Registra el pago en estado PENDING con el comprobante cargado
    const result = await applyBookingPayment({
      bookingId: booking.id,
      amount: amountDeclared,
      paymentMethod: 'TRANSFERENCIA',
      paymentType: isPartial ? 'DEPOSIT_PARTIAL' : 'FULL_PAYMENT',
      receiptUrl: receiptUrl || null,
      status: 'PENDING', // Pasa a PENDING_APPROVAL para que el admin valide
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      message: 'Comprobante recibido. La reserva se encuentra pendiente de aprobación por el administrador.',
    });
  } catch (error: any) {
    console.error('Error en checkout transferencia:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error al procesar la transferencia' }, { status: 500 });
  }
}
