'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Booking, Payment, CourtSettings } from '@/types';
import {
  CheckCircle,
  Clock,
  Calendar,
  Share2,
  Printer,
  Home,
  AlertTriangle,
  Receipt,
  User,
  Phone,
  CreditCard,
  Building2,
  ArrowRight,
} from 'lucide-react';

export default function ConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;
  const searchParams = useSearchParams();
  const isSimulated = searchParams.get('simulated') === 'true';

  const [booking, setBooking] = useState<Booking | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<CourtSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBooking(data.booking);
          setPayments(data.payments || []);
          setSettings(data.settings || null);
        } else {
          setError(data.error || 'Reserva no encontrada');
        }
      })
      .catch((err) => {
        console.error('Error cargando reserva:', err);
        setError('Error de conexión');
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div style={{
          width: '42px',
          height: '42px',
          border: '3px solid rgba(16, 185, 129, 0.2)',
          borderTopColor: 'var(--pitch-green)',
          borderRadius: '50%',
          margin: '0 auto 1.25rem auto',
          animation: 'spin 1s linear infinite',
        }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando comprobante de reserva...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '2.5rem' }}>
          <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
          <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Reserva no encontrada</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            No pudimos recuperar los datos del turno solicitado.
          </p>
          <Link href="/" className="btn-primary">
            Volver a la Grilla de Turnos
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(`${booking.booking_date}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isConfirmed = booking.status === 'CONFIRMED';
  const isPendingApproval = booking.status === 'PENDING_APPROVAL';

  // Generar mensaje de WhatsApp para el equipo
  const generateWhatsAppMessage = () => {
    const text = `⚽ *TURNO CONFIRMADO - FÚTBOL 5*\n\n` +
      `📅 *Fecha:* ${formattedDate}\n` +
      `⏰ *Horario:* ${booking.start_time} a ${booking.end_time} hs\n` +
      `🏟️ *Cancha:* ${settings?.court_name || 'Cancha 1'}\n` +
      `🏷️ *Reserva:* #${booking.booking_number}\n\n` +
      `💰 *Total del Turno:* $${booking.total_amount.toLocaleString('es-AR')}\n` +
      `✅ *Seña/Abonado:* $${booking.paid_amount.toLocaleString('es-AR')}\n` +
      `👉 *Resta abonar en cancha:* $${booking.remaining_balance.toLocaleString('es-AR')}\n\n` +
      `¡Nos vemos 10 minutos antes para entrar en calor! 🧤`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="container" style={{ padding: '3rem 1rem 5rem 1rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Banner de Estado */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          {isConfirmed ? (
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid var(--pitch-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--pitch-green-light)',
                boxShadow: '0 0 24px var(--pitch-glow)',
              }}>
                <CheckCircle size={36} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
                ¡Turno Confirmado!
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                Te esperamos en la cancha. Guardá este comprobante o compartilo con tu equipo.
              </p>
            </div>
          ) : isPendingApproval ? (
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '2px solid var(--night-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--night-amber)',
              }}>
                <Clock size={36} />
              </div>
              <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.85rem', fontWeight: 900, color: '#fff' }}>
                Comprobante en Revisión
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Tu transferencia fue recibida. La administración validará el comprobante a la brevedad.
              </p>
            </div>
          ) : (
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <Clock size={48} color="var(--night-amber)" />
              <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.85rem', fontWeight: 900, color: '#fff' }}>
                Reserva en Proceso
              </h1>
            </div>
          )}

          {isSimulated && (
            <div style={{
              display: 'inline-block',
              marginTop: '0.75rem',
              padding: '0.35rem 0.85rem',
              background: 'rgba(0, 158, 227, 0.15)',
              border: '1px solid rgba(0, 158, 227, 0.3)',
              borderRadius: '9999px',
              color: '#38bdf8',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}>
              Entorno Sandbox: Pago Acreditado en Modo de Prueba
            </div>
          )}
        </div>

        {/* VOUCHER / TICKET */}
        <div className="glass-card" style={{
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          position: 'relative',
        }}>
          {/* Ticket Header */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            padding: '1.5rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#fff',
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
                VOUCHER DE RESERVA OFICIAL
              </span>
              <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.5rem', fontWeight: 900, margin: '0.2rem 0' }}>
                {settings?.court_name || 'Cancha 1 - Césped Sintético Pro'}
              </h2>
              <span style={{ fontSize: '0.85rem', opacity: 0.95 }}>
                Av. del Deporte 1250 • Turno de 60 minutos
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', opacity: 0.8, display: 'block' }}>NÚMERO</span>
              <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.05em' }}>
                #{booking.booking_number}
              </span>
            </div>
          </div>

          {/* Ticket Body */}
          <div style={{ padding: '2rem' }}>
            {/* Grid de Horario y Titular */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              borderBottom: '1px solid var(--stadium-border)',
              paddingBottom: '1.5rem',
              marginBottom: '1.5rem',
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} /> Fecha del Partido
                </span>
                <p style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginTop: '0.2rem', textTransform: 'capitalize' }}>
                  {formattedDate}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={14} /> Horario
                </span>
                <p style={{ fontWeight: 800, color: 'var(--pitch-green-light)', fontSize: '1.15rem', marginTop: '0.2rem' }}>
                  {booking.start_time} - {booking.end_time} hs
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <User size={14} /> Titular
                </span>
                <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                  {booking.customer_name}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={14} /> Teléfono / WhatsApp
                </span>
                <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', marginTop: '0.2rem' }}>
                  {booking.customer_phone}
                </p>
              </div>
            </div>

            {/* Imputación Financiera */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--stadium-border)',
              borderRadius: '0.85rem',
              padding: '1.25rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Receipt size={18} color="var(--pitch-green)" />
                <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                  Detalle e Imputación de Pagos
                </h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Valor Total del Turno:</span>
                  <span style={{ fontWeight: 700, color: '#fff' }}>${booking.total_amount.toLocaleString('es-AR')}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--pitch-green-light)', fontWeight: 600 }}>
                    Monto Abonado ({booking.payment_method || 'Online'}):
                  </span>
                  <span style={{ fontWeight: 800, color: 'var(--pitch-green-light)' }}>
                    - ${booking.paid_amount.toLocaleString('es-AR')}
                  </span>
                </div>

                <div style={{
                  borderTop: '1px solid var(--stadium-border)',
                  paddingTop: '0.75rem',
                  marginTop: '0.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                      Saldo Pendiente a Abonar en Cancha:
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Se cancela en efectivo o débito en recepción antes de jugar
                    </span>
                  </div>
                  <span style={{
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    color: booking.remaining_balance > 0 ? '#fbbf24' : 'var(--pitch-green-light)',
                  }}>
                    ${booking.remaining_balance.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones del Voucher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginTop: '2rem',
        }}>
          {/* Botón WhatsApp */}
          <a
            href={generateWhatsAppMessage()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
            }}
          >
            <Share2 size={18} />
            Enviar al Grupo de WhatsApp
          </a>

          {/* Botón Imprimir / PDF */}
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary"
          >
            <Printer size={18} />
            Imprimir / Guardar
          </button>

          {/* Volver al inicio */}
          <Link
            href="/"
            className="btn-secondary"
            style={{ textDecoration: 'none' }}
          >
            <Home size={18} />
            Volver a la Grilla
          </Link>
        </div>
      </div>
    </div>
  );
}
