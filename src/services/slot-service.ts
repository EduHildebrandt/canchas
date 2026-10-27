import { TimeSlot } from '@/types';
import { getCourtSettings } from './court-service';
import { getBookingsForDate } from './booking-service';

/**
 * Convierte cadena "HH:MM" a minutos desde medianoche
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Convierte minutos a cadena "HH:MM"
 */
function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calcula los turnos de la cancha para una fecha seleccionada con disponibilidad en tiempo real
 */
export async function getTimeSlotsForDate(dateStr: string): Promise<TimeSlot[]> {
  const settings = await getCourtSettings();
  const bookings = await getBookingsForDate(dateStr);

  const startMinutes = timeToMinutes(settings.opening_time);
  let endMinutes = timeToMinutes(settings.closing_time);
  if (endMinutes <= startMinutes) {
    // Si cierra a medianoche ("24:00" o "00:00")
    endMinutes = 24 * 60;
  }

  const nightStartMinutes = timeToMinutes(settings.night_start_time);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isToday = dateStr === todayStr;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const slots: TimeSlot[] = [];

  for (let m = startMinutes; m < endMinutes; m += settings.slot_duration_minutes) {
    const slotStart = minutesToTime(m);
    const slotEnd = minutesToTime(m + settings.slot_duration_minutes);
    const isNight = m >= nightStartMinutes;
    const price = isNight ? settings.night_price : settings.day_price;

    // Calcular seña mínima
    let depositAmount = 0;
    if (settings.deposit_type === 'PERCENTAGE') {
      depositAmount = Math.round((price * settings.deposit_value) / 100);
    } else {
      depositAmount = Math.min(settings.deposit_value, price);
    }

    // Buscar si hay reserva activa en este horario
    const matchedBooking = bookings.find((b) => b.start_time === slotStart);

    let status: 'AVAILABLE' | 'HOLD' | 'BOOKED' | 'PAST' = 'AVAILABLE';
    let isAvailable = true;

    // Verificar si el turno ya pasó
    if (isToday && m + settings.slot_duration_minutes <= currentMinutes) {
      status = 'PAST';
      isAvailable = false;
    } else if (matchedBooking) {
      if (matchedBooking.status === 'HOLD') {
        status = 'HOLD';
        isAvailable = false;
      } else if (['PENDING_APPROVAL', 'CONFIRMED', 'COMPLETED'].includes(matchedBooking.status)) {
        status = 'BOOKED';
        isAvailable = false;
      }
    }

    slots.push({
      start_time: slotStart,
      end_time: slotEnd,
      is_night: isNight,
      price,
      deposit_amount: depositAmount,
      is_available: isAvailable,
      status,
      booking: matchedBooking,
    });
  }

  return slots;
}
