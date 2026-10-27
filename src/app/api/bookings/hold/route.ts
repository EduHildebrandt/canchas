import { NextRequest, NextResponse } from 'next/server';
import { createHoldBooking } from '@/services/booking-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingDate, startTime, endTime, customerName, customerPhone, customerEmail, notes } = body;

    if (!bookingDate || !startTime || !endTime || !customerName || !customerPhone) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios para generar la reserva.' },
        { status: 400 }
      );
    }

    const result = await createHoldBooking({
      bookingDate,
      startTime,
      endTime,
      customerName,
      customerPhone,
      customerEmail: customerEmail || 'sin-email@reserva.com',
      notes,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 409 });
    }

    return NextResponse.json({ success: true, booking: result.booking });
  } catch (error: any) {
    console.error('Error en POST /api/bookings/hold:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar la reserva' },
      { status: 500 }
    );
  }
}
