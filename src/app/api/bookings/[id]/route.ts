import { NextRequest, NextResponse } from 'next/server';
import { getBookingById } from '@/services/booking-service';
import { getCourtSettings } from '@/services/court-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { booking, payments } = await getBookingById(id);

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
    }

    const settings = await getCourtSettings();

    return NextResponse.json({
      success: true,
      booking,
      payments,
      settings,
    });
  } catch (error: any) {
    console.error('Error obteniendo reserva:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener la reserva' },
      { status: 500 }
    );
  }
}
