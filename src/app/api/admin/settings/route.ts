import { NextRequest, NextResponse } from 'next/server';
import { getCourtSettings, updateCourtSettings } from '@/services/court-service';

export async function GET() {
  try {
    const settings = await getCourtSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error('Error obteniendo settings en admin:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = await updateCourtSettings(body);
    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error('Error actualizando settings en admin:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
