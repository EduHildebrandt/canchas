import { NextResponse } from 'next/server';
import { releaseExpiredHolds } from '@/services/booking-service';

export async function GET() {
  try {
    const releasedCount = await releaseExpiredHolds();
    return NextResponse.json({ success: true, releasedCount });
  } catch (error: any) {
    console.error('Error en release-expired:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error liberando turnos' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
