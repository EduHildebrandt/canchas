'use client';

import React, { useState, useEffect } from 'react';
import { TimeSlot, CourtSettings, Booking } from '@/types';
import BookingModal from '@/components/BookingModal';
import {
  Calendar as CalendarIcon,
  Clock,
  Sun,
  Moon,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Zap,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [settings, setSettings] = useState<CourtSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Inicializar con la fecha de hoy
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // Cargar slots y configuración de la fecha seleccionada
  useEffect(() => {
    if (!selectedDate) return;

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/slots?date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setSlots(data.slots || []);
          setSettings(data.settings || null);
        }
      })
      .catch((err) => console.error('Error cargando turnos:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Manejo de cambio de fechas con botones rápidos
  const changeDateByDays = (days: number) => {
    const current = new Date(`${selectedDate}T12:00:00`);
    current.setDate(current.getDate() + days);
    const newDateStr = current.toISOString().split('T')[0];

    const todayStr = new Date().toISOString().split('T')[0];
    if (newDateStr >= todayStr) {
      setSelectedDate(newDateStr);
    }
  };

  const todayStr = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '';
  const tomorrowStr = typeof window !== 'undefined'
    ? new Date(Date.now() + 86400000).toISOString().split('T')[0]
    : '';

  // Agrupar turnos en Diurnos y Nocturnos
  const daySlots = slots.filter((s) => !s.is_night);
  const nightSlots = slots.filter((s) => s.is_night);

  const formattedSelectedDate = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '';

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '3.5rem 0 2.5rem 0',
        borderBottom: '1px solid var(--stadium-border)',
        overflow: 'hidden',
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.9rem',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--pitch-green-light)',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '1rem',
          }}>
            <Zap size={15} />
            <span>Sistema Oficial de Reservas en Línea</span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-title)',
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
            color: '#ffffff',
          }}>
            Reservá tu Cancha de Fútbol 5 en <span style={{ color: 'var(--pitch-green-light)' }}>1 Minuto</span>
          </h1>

          <p style={{
            maxWidth: '680px',
            margin: '0 auto 1.75rem auto',
            color: 'var(--text-secondary)',
            fontSize: '1.05rem',
            lineHeight: 1.6,
          }}>
            Césped sintético monofilamento de 50mm, iluminación LED profesional y vestuarios con duchas.
            Elegí tu horario, aboná la <strong>seña</strong> o el <strong>total</strong> y asegurá tu partido.
          </p>

          {/* Reassurance pills */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} color="var(--pitch-green)" />
              <span>Bloqueo anti-colisión de 20 min</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={16} color="#38bdf8" />
              <span>Mercado Pago & Transferencia</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={16} color="var(--night-amber)" />
              <span>Turnos de 60 minutos</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container" style={{ marginTop: '2.5rem' }}>
        {/* Selector de Fecha */}
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            {/* Quick buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedDate === todayStr ? 'var(--pitch-green)' : 'var(--stadium-border)',
                  background: selectedDate === todayStr ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedDate === todayStr ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => setSelectedDate(tomorrowStr)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedDate === tomorrowStr ? 'var(--pitch-green)' : 'var(--stadium-border)',
                  background: selectedDate === tomorrowStr ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedDate === tomorrowStr ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Mañana
              </button>

              {/* Prev / Next day arrows */}
              <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => changeDateByDays(-1)}
                  disabled={selectedDate <= todayStr}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--stadium-border)',
                    borderRadius: '0.5rem',
                    padding: '0.45rem',
                    color: selectedDate <= todayStr ? 'var(--text-muted)' : '#fff',
                    cursor: selectedDate <= todayStr ? 'not-allowed' : 'pointer',
                  }}
                  title="Día anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => changeDateByDays(1)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--stadium-border)',
                    borderRadius: '0.5rem',
                    padding: '0.45rem',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                  title="Día siguiente"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Date picker input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff', fontWeight: 700 }}>
                <CalendarIcon size={18} color="var(--pitch-green)" />
                <span style={{ textTransform: 'capitalize', fontSize: '0.95rem' }}>{formattedSelectedDate}</span>
              </div>
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid var(--stadium-border)',
                  color: '#fff',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
              />
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, color: '#fff' }}>Referencias:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--pitch-green)' }}></span>
            <span>Disponible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--night-amber)' }}></span>
            <span>En proceso de pago (HOLD)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#64748b' }}></span>
            <span>Ocupado / Reservado</span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(16, 185, 129, 0.2)',
              borderTopColor: 'var(--pitch-green)',
              borderRadius: '50%',
              margin: '0 auto 1rem auto',
              animation: 'spin 1s linear infinite',
            }}></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Cargando disponibilidad de la cancha...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : slots.length === 0 ? (
          /* Empty State */
          <div className="glass-card" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <Info size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>No hay turnos configurados para esta fecha</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Por favor seleccione otra fecha o contacte a la administración.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Turnos Diurnos */}
            {daySlots.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Sun size={20} color="#fbbf24" />
                  <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                    Turnos Diurnos
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    (${settings?.day_price.toLocaleString('es-AR') || '24.000'} / hora)
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '1rem',
                }}>
                  {daySlots.map((slot) => (
                    <SlotCard
                      key={slot.start_time}
                      slot={slot}
                      onSelect={() => setSelectedSlot(slot)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Turnos Nocturnos */}
            {nightSlots.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Moon size={20} color="#38bdf8" />
                  <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                    Turnos Nocturnos (Iluminación LED)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    (${settings?.night_price.toLocaleString('es-AR') || '30.000'} / hora)
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: '1rem',
                }}>
                  {nightSlots.map((slot) => (
                    <SlotCard
                      key={slot.start_time}
                      slot={slot}
                      onSelect={() => setSelectedSlot(slot)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Modal de Reserva */}
      {selectedSlot && settings && (
        <BookingModal
          slot={selectedSlot}
          dateStr={selectedDate}
          settings={settings}
          onClose={() => setSelectedSlot(null)}
          onSuccess={(booking) => {
            setSelectedSlot(null);
            // Refrescar disponibilidad
            fetch(`/api/slots?date=${selectedDate}`)
              .then((r) => r.json())
              .then((d) => d.success && setSlots(d.slots));
          }}
        />
      )}
    </div>
  );
}

// Componente individual de Tarjeta de Turno
function SlotCard({ slot, onSelect }: { slot: TimeSlot; onSelect: () => void }) {
  const isAvailable = slot.is_available && slot.status === 'AVAILABLE';
  const isHold = slot.status === 'HOLD';
  const isBooked = slot.status === 'BOOKED';
  const isPast = slot.status === 'PAST';

  let borderColor = 'var(--stadium-border)';
  let bgStyle = 'rgba(17, 24, 39, 0.6)';

  if (isAvailable) {
    borderColor = 'rgba(16, 185, 129, 0.3)';
    bgStyle = 'rgba(16, 185, 129, 0.05)';
  } else if (isHold) {
    borderColor = 'rgba(245, 158, 11, 0.3)';
    bgStyle = 'rgba(245, 158, 11, 0.05)';
  } else if (isBooked || isPast) {
    borderColor = 'rgba(255, 255, 255, 0.04)';
    bgStyle = 'rgba(255, 255, 255, 0.02)';
  }

  return (
    <div
      onClick={() => {
        if (isAvailable) onSelect();
      }}
      className={isAvailable ? 'glass-card-interactive' : 'glass-card'}
      style={{
        border: `1px solid ${borderColor}`,
        background: bgStyle,
        padding: '1.25rem',
        borderRadius: '0.85rem',
        cursor: isAvailable ? 'pointer' : 'default',
        opacity: isPast ? 0.45 : isBooked ? 0.65 : 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '145px',
      }}
    >
      <div>
        {/* Header de la tarjeta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{
            fontSize: '1.2rem',
            fontWeight: 800,
            fontFamily: 'var(--font-title)',
            color: '#fff',
            letterSpacing: '-0.02em',
          }}>
            {slot.start_time} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>- {slot.end_time}</span>
          </span>

          {isAvailable && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              background: 'rgba(16, 185, 129, 0.2)',
              color: 'var(--pitch-green-light)',
              padding: '2px 7px',
              borderRadius: '9999px',
            }}>
              Disponible
            </span>
          )}

          {isHold && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              background: 'rgba(245, 158, 11, 0.2)',
              color: 'var(--night-amber)',
              padding: '2px 7px',
              borderRadius: '9999px',
            }}>
              En pago (HOLD)
            </span>
          )}

          {isBooked && (
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--text-muted)',
              padding: '2px 7px',
              borderRadius: '9999px',
            }}>
              Reservado
            </span>
          )}

          {isPast && (
            <span style={{
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              padding: '2px 6px',
            }}>
              Finalizado
            </span>
          )}
        </div>

        {/* Tarifas */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
            ${slot.price.toLocaleString('es-AR')}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>total</span>
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Seña: <strong>${slot.deposit_amount.toLocaleString('es-AR')}</strong>
        </div>
      </div>

      {/* Botón / Footer */}
      <div style={{ marginTop: '0.85rem' }}>
        {isAvailable ? (
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
          >
            Reservar Turno
          </button>
        ) : isHold ? (
          <div style={{ fontSize: '0.7rem', color: 'var(--night-amber)', textAlign: 'center' }}>
            Bloqueado temporalmente
          </div>
        ) : (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            No disponible
          </div>
        )}
      </div>
    </div>
  );
}
