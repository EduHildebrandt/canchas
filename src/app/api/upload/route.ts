import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bookingId = formData.get('bookingId') as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `receipt_${bookingId || 'temp'}_${Date.now()}.${fileExt}`;

    // 1. Si Supabase Storage está configurado, intentar subir al bucket 'receipts'
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

          return NextResponse.json({
            success: true,
            url: publicData.publicUrl,
            storage: 'supabase',
          });
        }
      } catch (err) {
        console.warn('Fallo upload a Supabase Storage, guardando localmente:', err);
      }
    }

    // 2. Almacenamiento local en public/uploads/receipts como fallback
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'receipts');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/receipts/${fileName}`;
    return NextResponse.json({
      success: true,
      url: publicUrl,
      storage: 'local',
    });
  } catch (error: any) {
    console.error('Error en /api/upload:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error al subir el archivo' }, { status: 500 });
  }
}
