import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { getBookingsForDate } from '@/services/booking-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const filter = searchParams.get('filter'); // 'pending_transfers' | 'all'

    // 1. Filtrar transferencias pendientes de aprobación
    if (filter === 'pending_transfers') {
      if (supabaseAdmin || supabase) {
        const client = supabaseAdmin || supabase;
        const { data, error } = await client!
          .from('bookings')
          .select('*, payments(*)')
          .eq('status', 'PENDING_APPROVAL')
          .order('booking_date', { ascending: true });

        if (!error && data) {
          return NextResponse.json({ success: true, bookings: data });
        }
      }
      return NextResponse.json({ success: true, bookings: [] });
    }

    // 2. Obtener reservas por fecha
    if (date) {
      const bookings = await getBookingsForDate(date);
      return NextResponse.json({ success: true, bookings });
    }

    // 3. Obtener todas las reservas recientes
    if (supabaseAdmin || supabase) {
      const client = supabaseAdmin || supabase;
      const { data, error } = await client!
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: false })
        .limit(50);

      if (!error && data) {
        return NextResponse.json({ success: true, bookings: data });
      }
    }

    return NextResponse.json({ success: true, bookings: [] });
  } catch (error: any) {
    console.error('Error en GET /api/admin/bookings:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
