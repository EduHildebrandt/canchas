'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TimeSlot, CourtSettings, Booking } from '@/types';
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  Copy,
  Upload,
  AlertCircle,
  CreditCard,
  Building2,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface BookingModalProps {
  slot: TimeSlot;
  dateStr: string;
  settings: CourtSettings;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
}

export default function BookingModal({ slot, dateStr, settings, onClose, onSuccess }: BookingModalProps) {
  const router = useRouter();

  // Paso 1: Datos de Contacto
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Paso 2: Modalidad de Pago ('DEPOSIT_PARTIAL' o 'FULL_PAYMENT')
  const [paymentType, setPaymentType] = useState<'DEPOSIT_PARTIAL' | 'FULL_PAYMENT'>('DEPOSIT_PARTIAL');

  // Paso 3: Método de Pago ('MERCADOPAGO' o 'TRANSFERENCIA')
  const [paymentMethod, setPaymentMethod] = useState<'MERCADOPAGO' | 'TRANSFERENCIA'>('MERCADOPAGO');

  // Estado del HOLD y Timer de 20 minutos
  const [holdBooking, setHoldBooking] = useState<Booking | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(settings.hold_timeout_minutes * 60);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Comprobante (almacenamos el File nativo para enviarlo como FormData al upload endpoint)
  const [receiptFileObj, setReceiptFileObj] = useState<File | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);

  // Estados de proceso
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Formato de fecha legible
  const formattedDate = new Date(`${dateStr}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const amountToPay = paymentType === 'DEPOSIT_PARTIAL' ? slot.deposit_amount : slot.price;
  const remainingBalance = Math.max(0, slot.price - amountToPay);

  // Countdown timer cuando el turno entra en HOLD
  useEffect(() => {
    if (!holdBooking) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMessage('El tiempo de reserva temporal ha expirado. Por favor, intente nuevamente.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [holdBooking]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Formato no permitido. Use JPG, PNG, WEBP o PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('El archivo no debe superar los 5MB.');
      return;
    }

    setReceiptFileObj(file);
    setReceiptFileName(file.name);
    setErrorMessage(null);
  };

  // Crear o asegurar el bloqueo HOLD de 20 min antes de pagar
  const ensureHoldBooking = async (): Promise<Booking | null> => {
    if (holdBooking) return holdBooking;

    const res = await fetch('/api/bookings/hold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingDate: dateStr,
        startTime: slot.start_time,
        endTime: slot.end_time,
        customerName,
        customerPhone,
        customerEmail: customerEmail || 'sin-email@reserva.com',
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'No se pudo reservar el turno temporalmente.');
    }

    setHoldBooking(data.booking);
    return data.booking;
  };

  const handleProcessPayment = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Por favor ingrese su Nombre y Teléfono / WhatsApp.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Crear el HOLD de 20 min
      const booking = await ensureHoldBooking();
      if (!booking) return;

      if (paymentMethod === 'MERCADOPAGO') {
        // Redirigir o iniciar checkout Mercado Pago
        const mpRes = await fetch('/api/checkout/mercadopago', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: booking.id,
            paymentType,
          }),
        });

        const mpData = await mpRes.json();
        if (!mpData.success) {
          throw new Error(mpData.error || 'Error al conectar con Mercado Pago.');
        }

        // Redirigir al link de pago oficial o modo sandbox
        window.location.href = mpData.initPoint;
      } else {
        // Transferencia bancaria — subir comprobante real
        if (!receiptFileObj) {
          setErrorMessage('Por favor suba la captura o comprobante de la transferencia para continuar.');
          setIsSubmitting(false);
          return;
        }

        const formData = new FormData();
        formData.append('bookingId', booking.id);
        formData.append('paymentType', paymentType);
        formData.append('receipt', receiptFileObj);

        const transRes = await fetch('/api/receipts/upload', {
          method: 'POST',
          body: formData,
        });

        const transData = await transRes.json();
        if (!transData.success) {
          throw new Error(transData.error || 'Error al procesar el comprobante.');
        }

        onSuccess(transData.booking);
        router.push(`/reserva/confirmacion/${booking.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error inesperado.');
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      zIndex: 100,
    }}>
      <div className="glass-card" style={{
        maxWidth: '620px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative',
        padding: '2rem',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Header del Modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--pitch-green-light)',
              letterSpacing: '0.05em',
              marginBottom: '0.3rem',
            }}>
              <Zap size={14} /> Reserva Instantánea
            </span>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              Confirmar Turno Fútbol 5
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem', textTransform: 'capitalize' }}>
              {formattedDate} • {slot.start_time} a {slot.end_time} hs
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--stadium-border)',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen del Turno */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--stadium-border)',
          borderRadius: '0.75rem',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem',
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Horario</span>
            <p style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{slot.start_time} - {slot.end_time} hs</p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tipo de Turno</span>
            <p style={{ fontWeight: 600, color: slot.is_night ? 'var(--night-amber)' : 'var(--pitch-green)', fontSize: '0.9rem' }}>
              {slot.is_night ? 'Nocturno (Luz LED)' : 'Diurno'}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valor Total</span>
            <p style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem' }}>${slot.price.toLocaleString('es-AR')}</p>
          </div>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '0.75rem',
            padding: '0.85rem 1rem',
            color: '#fca5a5',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1.25rem',
          }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SECCIÓN 1: Datos del Titular */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem', color: '#fff' }}>
            1. Datos del Titular de la Reserva
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <input
                type="text"
                placeholder="Nombre y Apellido *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--stadium-border)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
            </div>
            <div>
              <input
                type="tel"
                placeholder="Teléfono / WhatsApp *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--stadium-border)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
            </div>
          </div>
          <input
            type="email"
            placeholder="Email (opcional para recibir el comprobante)"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--stadium-border)',
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          />
        </div>

        {/* SECCIÓN 2: Modalidad de Pago (Seña vs Total) */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem', color: '#fff' }}>
            2. Modalidad de Pago
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Seña (Pago Parcial) */}
            <div
              onClick={() => setPaymentType('DEPOSIT_PARTIAL')}
              style={{
                border: paymentType === 'DEPOSIT_PARTIAL' ? '2px solid var(--pitch-green)' : '1px solid var(--stadium-border)',
                background: paymentType === 'DEPOSIT_PARTIAL' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '0.75rem',
                padding: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>Abonar Seña</span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: 'var(--pitch-green-light)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}>
                  {settings.deposit_type === 'PERCENTAGE' ? `${settings.deposit_value}%` : 'Fija'}
                </span>
              </div>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--pitch-green-light)', marginBottom: '0.2rem' }}>
                ${slot.deposit_amount.toLocaleString('es-AR')}
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Resta ${ (slot.price - slot.deposit_amount).toLocaleString('es-AR') } en cancha
              </span>
            </div>

            {/* Pago Total */}
            <div
              onClick={() => setPaymentType('FULL_PAYMENT')}
              style={{
                border: paymentType === 'FULL_PAYMENT' ? '2px solid var(--pitch-green)' : '1px solid var(--stadium-border)',
                background: paymentType === 'FULL_PAYMENT' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '0.75rem',
                padding: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>Pago Completo</span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}>
                  100%
                </span>
              </div>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.2rem' }}>
                ${slot.price.toLocaleString('es-AR')}
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--pitch-green)' }}>
                ¡Turno saldado sin saldo pendiente!
              </span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Medio de Pago */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem', color: '#fff' }}>
            3. Medio de Pago
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            {/* Mercado Pago */}
            <div
              onClick={() => setPaymentMethod('MERCADOPAGO')}
              style={{
                border: paymentMethod === 'MERCADOPAGO' ? '2px solid #009ee3' : '1px solid var(--stadium-border)',
                background: paymentMethod === 'MERCADOPAGO' ? 'rgba(0, 158, 227, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '0.75rem',
                padding: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(0, 158, 227, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
              }}>
                <CreditCard size={18} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>Mercado Pago</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Acreditación instantánea</span>
              </div>
            </div>

            {/* Transferencia Bancaria */}
            <div
              onClick={() => setPaymentMethod('TRANSFERENCIA')}
              style={{
                border: paymentMethod === 'TRANSFERENCIA' ? '2px solid var(--pitch-green)' : '1px solid var(--stadium-border)',
                background: paymentMethod === 'TRANSFERENCIA' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '0.75rem',
                padding: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--pitch-green)',
              }}>
                <Building2 size={18} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fff' }}>Transferencia</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CBU / Alias</span>
              </div>
            </div>
          </div>

          {/* Si eligió Transferencia: Datos Bancarios + Upload + Timer de 20 min */}
          {paymentMethod === 'TRANSFERENCIA' && (
            <div style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              padding: '1rem',
            }}>
              {/* Banner de Timer */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '0.5rem',
                marginBottom: '1rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--night-amber)' }}>
                  <Clock size={16} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Tiempo para transferir:</span>
                </div>
                <span style={{
                  fontFamily: 'monospace',
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#fbbf24',
                }}>
                  {formatTimer(timeLeftSeconds)}
                </span>
              </div>

              {/* Datos de la cuenta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {/* Alias */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.04)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Alias:</span>
                    <p style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{settings.bank_alias}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(settings.bank_alias, 'alias')}
                    style={{ color: copiedField === 'alias' ? 'var(--pitch-green)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                  >
                    {copiedField === 'alias' ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    {copiedField === 'alias' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>

                {/* CBU */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.04)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CBU:</span>
                    <p style={{ fontFamily: 'monospace', fontWeight: 700, color: '#fff', fontSize: '0.85rem' }}>{settings.bank_cbu}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(settings.bank_cbu, 'cbu')}
                    style={{ color: copiedField === 'cbu' ? 'var(--pitch-green)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
                  >
                    {copiedField === 'cbu' ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    {copiedField === 'cbu' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>

                {/* Titular */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  <span>Titular: <strong>{settings.bank_holder}</strong> • {settings.bank_name}</span>
                </div>
              </div>

              {/* Subida de Comprobante */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Adjuntar Comprobante de Transferencia *
                </label>
                <div style={{
                  border: '1px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem',
                  padding: '0.85rem',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  position: 'relative',
                  cursor: 'pointer',
                }}>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                    <Upload size={20} color="var(--pitch-green)" />
                    <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>
                      {receiptFileName ? `Archivo: ${receiptFileName}` : 'Subir captura o PDF del comprobante'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Máximo 5MB (JPG, PNG o PDF)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Botón de Acción Principal */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ flex: 1 }}
            disabled={isSubmitting}
          >
            Cancelar
          </button>

          {paymentMethod === 'MERCADOPAGO' ? (
            <button
              type="button"
              onClick={handleProcessPayment}
              className="btn-mp"
              style={{ flex: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Conectando...' : `Pagar $${amountToPay.toLocaleString('es-AR')} con Mercado Pago`}
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleProcessPayment}
              className="btn-primary"
              style={{ flex: 2 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Procesando...' : `Confirmar Transferencia ($${amountToPay.toLocaleString('es-AR')})`}
              <ShieldCheck size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
