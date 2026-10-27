import { CourtSettings } from '@/types';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const DEFAULT_COURT_SETTINGS: CourtSettings = {
  id: 'default-court-1',
  court_name: 'Cancha 1 - Césped Sintético Pro',
  opening_time: '09:00',
  closing_time: '24:00',
  slot_duration_minutes: 60,
  day_price: 24000,
  night_price: 30000,
  night_start_time: '18:00',
  deposit_type: 'PERCENTAGE',
  deposit_value: 30, // 30%
  bank_alias: 'cancha.futbol5.mp',
  bank_cbu: '0000003100012345678901',
  bank_holder: 'Complejo Deportivo Fútbol 5 S.A.',
  bank_name: 'Mercado Pago / Banco Galicia',
  hold_timeout_minutes: 20,
  is_active: true,
};

// Memoria local de respaldo para desarrollo / offline
let localSettingsCache: CourtSettings = { ...DEFAULT_COURT_SETTINGS };

/**
 * Obtiene la configuración de la cancha (Supabase o Fallback)
 */
export async function getCourtSettings(): Promise<CourtSettings> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('court_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          court_name: data.court_name,
          opening_time: data.opening_time.substring(0, 5),
          closing_time: data.closing_time.substring(0, 5),
          slot_duration_minutes: Number(data.slot_duration_minutes),
          day_price: Number(data.day_price),
          night_price: Number(data.night_price),
          night_start_time: data.night_start_time.substring(0, 5),
          deposit_type: data.deposit_type,
          deposit_value: Number(data.deposit_value),
          bank_alias: data.bank_alias,
          bank_cbu: data.bank_cbu,
          bank_holder: data.bank_holder,
          bank_name: data.bank_name,
          hold_timeout_minutes: Number(data.hold_timeout_minutes),
          is_active: data.is_active,
        };
      }
    } catch (e) {
      console.warn('Fallo consulta a Supabase court_settings, usando fallback:', e);
    }
  }

  return localSettingsCache;
}

/**
 * Actualiza la configuración de la cancha (Panel Admin)
 */
export async function updateCourtSettings(settings: Partial<CourtSettings>): Promise<CourtSettings> {
  const updated = { ...localSettingsCache, ...settings };
  localSettingsCache = updated;

  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('court_settings')
        .upsert({
          id: updated.id,
          court_name: updated.court_name,
          opening_time: updated.opening_time,
          closing_time: updated.closing_time,
          slot_duration_minutes: updated.slot_duration_minutes,
          day_price: updated.day_price,
          night_price: updated.night_price,
          night_start_time: updated.night_start_time,
          deposit_type: updated.deposit_type,
          deposit_value: updated.deposit_value,
          bank_alias: updated.bank_alias,
          bank_cbu: updated.bank_cbu,
          bank_holder: updated.bank_holder,
          bank_name: updated.bank_name,
          hold_timeout_minutes: updated.hold_timeout_minutes,
          is_active: updated.is_active,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error al actualizar court_settings en Supabase:', error);
      }
    } catch (e) {
      console.warn('Excepción guardando settings en Supabase:', e);
    }
  }

  return updated;
}
