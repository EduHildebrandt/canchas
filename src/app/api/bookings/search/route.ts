import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getBookingById } from '@/services/booking-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json({ success: false, error: 'Ingrese un número de reserva o teléfono' }, { status: 400 });
    }

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('id, booking_number, booking_date, start_time, end_time, customer_name, total_amount, paid_amount, remaining_balance, status, payment_status')
          .or(`booking_number.ilike.%${query}%,customer_phone.ilike.%${query}%`)
          .order('booking_date', { ascending: false })
          .limit(10);

        if (!error && data) {
          return NextResponse.json({ success: true, bookings: data });
        }
      } catch (e) {
        console.warn('Fallo búsqueda en Supabase:', e);
      }
    }

    // Fallback: Si el query coincide con un booking_number directo o id
    return NextResponse.json({ success: true, bookings: [] });
  } catch (error: any) {
    console.error('Error buscando reserva:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
