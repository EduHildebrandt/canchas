import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getBookingById, applyBookingPayment } from '@/services/booking-service';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = (formData.get('receipt') || formData.get('file')) as File | null;
    const bookingId = formData.get('bookingId') as string | null;
    const paymentType = (formData.get('paymentType') as 'DEPOSIT_PARTIAL' | 'FULL_PAYMENT') || 'DEPOSIT_PARTIAL';

    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Identificador de reserva faltante' }, { status: 400 });
    }

    const { booking } = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Reserva no encontrada' }, { status: 404 });
    }

    let receiptUrl = '';

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `receipt_${booking.booking_number}_${Date.now()}.${fileExt}`;

      // 1. Intentar subir a Supabase Storage bucket 'receipts' si está configurado
      if (supabaseAdmin) {
        try {
          const { data, error } = await supabaseAdmin.storage
            .from('receipts')
            .upload(fileName, buffer, {
              contentType: file.type,
              upsert: true,
            });

          if (!error && data) {
            const { data: publicData } = supabaseAdmin.storage
              .from('receipts')
              .getPublicUrl(fileName);
            receiptUrl = publicData.publicUrl;
          }
        } catch (err) {
          console.warn('Error subiendo a Supabase Storage, usando almacenamiento local:', err);
        }
      }

      // 2. Almacenamiento local como fallback de alta disponibilidad
      if (!receiptUrl) {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, buffer);
        receiptUrl = `/uploads/receipts/${fileName}`;
      }
    }

    const isPartial = paymentType === 'DEPOSIT_PARTIAL';
    const amount = isPartial ? booking.deposit_amount : booking.total_amount;

    // Registrar pago por transferencia en estado PENDING con comprobante
    const result = await applyBookingPayment({
      bookingId: booking.id,
      amount,
      paymentMethod: 'TRANSFERENCIA',
      paymentType,
      receiptUrl: receiptUrl || undefined,
      status: 'PENDING', // Pasa a PENDING_APPROVAL
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      booking: result.booking,
      receiptUrl,
      message: 'Comprobante recibido exitosamente.',
    });
  } catch (error: any) {
    console.error('Error en /api/receipts/upload:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error al procesar el comprobante' }, { status: 500 });
  }
}
