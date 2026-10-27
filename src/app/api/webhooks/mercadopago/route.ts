import { NextRequest, NextResponse } from 'next/server';
import { getPaymentDetails, isMercadoPagoConfigured } from '@/lib/mercadopago';
import { getBookingById, applyBookingPayment } from '@/services/booking-service';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Leer posibles payloads de Mercado Pago
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // El body puede estar vacío en algunas notificaciones IPN antiguas
    }

    // Identificar el ID del pago
    const paymentId =
      searchParams.get('data.id') ||
      searchParams.get('id') ||
      body?.data?.id ||
      body?.id;

    const topic = searchParams.get('type') || searchParams.get('topic') || body?.type;

    // 1. Manejo de Webhooks de Prueba / Simulación interna
    if (body?.test && body?.bookingId) {
      console.log(`[MercadoPago Webhook] Recibido test de simulación para reserva: ${body.bookingId}`);
      const { booking } = await getBookingById(body.bookingId);
      if (booking) {
        const amount = Number(body.amount) || booking.deposit_amount;
        await applyBookingPayment({
          bookingId: booking.id,
          amount,
          paymentMethod: 'MERCADOPAGO',
          paymentType: amount >= booking.total_amount ? 'FULL_PAYMENT' : 'DEPOSIT_PARTIAL',
          mpPaymentId: `TEST-WEBHOOK-${Date.now()}`,
          status: 'APPROVED',
        });
        return NextResponse.json({ received: true, simulated: true, bookingNumber: booking.booking_number });
      }
    }

    // 2. Procesamiento de Notificación Oficial de Mercado Pago
    if (paymentId && (topic === 'payment' || !topic)) {
      console.log(`[MercadoPago Webhook] Procesando notificación de pago: ${paymentId}`);

      if (isMercadoPagoConfigured) {
        const paymentData = await getPaymentDetails(paymentId);
        const bookingId = paymentData.external_reference;

        if (bookingId) {
          const { booking } = await getBookingById(bookingId);

          if (booking) {
            if (paymentData.status === 'approved') {
              const amountPaid = paymentData.transaction_amount;
              const isFullPayment = amountPaid >= booking.total_amount;

              await applyBookingPayment({
                bookingId: booking.id,
                amount: amountPaid,
                paymentMethod: 'MERCADOPAGO',
                paymentType: isFullPayment ? 'FULL_PAYMENT' : 'DEPOSIT_PARTIAL',
                mpPaymentId: String(paymentId),
                status: 'APPROVED',
              });

              console.log(
                `[MercadoPago Webhook] Reserva ${booking.booking_number} CONFIRMADA con éxito por $${amountPaid}`
              );
            } else if (['rejected', 'cancelled', 'refunded'].includes(paymentData.status)) {
              console.log(
                `[MercadoPago Webhook] Pago ${paymentId} en estado: ${paymentData.status} para reserva ${booking.booking_number}`
              );
            }
          } else {
            console.warn(`[MercadoPago Webhook] Reserva ${bookingId} no encontrada.`);
          }
        }
      } else {
        console.log(`[MercadoPago Webhook] Credenciales de MP no configuradas; webhook recibido con ID: ${paymentId}`);
      }
    }

    // Mercado Pago requiere siempre un código HTTP 200 OK para no reintentar infinitamente
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error procesando webhook de Mercado Pago:', error);
    // Retornar 200 de todas formas para evitar reintentos de MP si el error fue interno
    return NextResponse.json({ received: true, error: error.message }, { status: 200 });
  }
}

// Mercado Pago a veces verifica endpoints con peticiones GET
export async function GET() {
  return NextResponse.json({ status: 'active', service: 'Mercado Pago Webhook Receiver' });
}
