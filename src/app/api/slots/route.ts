import { NextRequest, NextResponse } from 'next/server';
import { getTimeSlotsForDate } from '@/services/slot-service';
import { getCourtSettings } from '@/services/court-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    const targetDate = dateParam || new Date().toISOString().split('T')[0];
    const settings = await getCourtSettings();
    const slots = await getTimeSlotsForDate(targetDate);

    return NextResponse.json({
      success: true,
      date: targetDate,
      settings,
      slots,
    });
  } catch (error: any) {
    console.error('Error en GET /api/slots:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al obtener turnos' },
      { status: 500 }
    );
  }
}
