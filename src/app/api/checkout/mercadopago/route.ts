import { NextRequest, NextResponse } from 'next/server';
import { createBookingPreference, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { getBookingById, applyBookingPayment } from '@/services/booking-service';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, paymentType } = await request.json();

    if (!bookingId || !paymentType) {
      return NextResponse.json({ success: false, error: 'Faltan parámetros de reserva o tipo de pago' }, { status: 400 });
    }

    const { booking } = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
    }

    const isPartial = paymentType === 'DEPOSIT_PARTIAL';
    const amountToPay = isPartial ? booking.deposit_amount : booking.total_amount;
    const title = isPartial ? 'Seña Cancha Fútbol 5' : 'Pago Total Cancha Fútbol 5';

    // Si Mercado Pago está configurado con credenciales activas, crear la preferencia real
    if (isMercadoPagoConfigured) {
      const preference = await createBookingPreference({
        bookingId: booking.id,
        bookingNumber: booking.booking_number,
        title,
        amount: amountToPay,
        customerEmail: booking.customer_email,
        customerName: booking.customer_name,
      });

      return NextResponse.json({
        success: true,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
        preferenceId: preference.id,
        isSimulated: false,
      });
    }

    // Modo Simulación para Desarrollo / Pruebas locales inmediatas sin credenciales de MP
    // Simula una aprobación inmediata para que el usuario pueda validar el flujo completo
    await applyBookingPayment({
      bookingId: booking.id,
      amount: amountToPay,
      paymentMethod: 'MERCADOPAGO',
      paymentType: isPartial ? 'DEPOSIT_PARTIAL' : 'FULL_PAYMENT',
      mpPaymentId: `SIM-MP-${Date.now()}`,
      status: 'APPROVED',
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.json({
      success: true,
      initPoint: `${appUrl}/reserva/confirmacion/${booking.id}?status=success&simulated=true`,
      isSimulated: true,
      message: 'Modo Sandbox de desarrollo: Pago acreditado automáticamente para pruebas.',
    });
  } catch (error: any) {
    console.error('Error en checkout Mercado Pago:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error al iniciar pago en Mercado Pago' }, { status: 500 });
  }
}
