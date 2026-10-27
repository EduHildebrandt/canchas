'use client';

import React, { useState, useEffect } from 'react';
import { Booking, CourtSettings, TimeSlot } from '@/types';
import {
  Calendar as CalendarIcon,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  PlusCircle,
  Settings,
  Eye,
  Phone,
  RefreshCw,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Save,
} from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Tabs: 'agenda' | 'transfers' | 'manual' | 'settings'
  const [activeTab, setActiveTab] = useState<'agenda' | 'transfers' | 'manual' | 'settings'>('agenda');

  // Agenda State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [settings, setSettings] = useState<CourtSettings | null>(null);
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  // Bandeja de Transferencias
  const [pendingTransfers, setPendingTransfers] = useState<any[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);

  // Modales
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [collectBalanceModal, setCollectBalanceModal] = useState<Booking | null>(null);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Formulario de Reserva Manual
  const [manualForm, setManualForm] = useState({
    bookingDate: new Date().toISOString().split('T')[0],
    startTime: '20:00',
    endTime: '21:00',
    customerName: '',
    customerPhone: '',
    paymentOption: 'DEPOSIT_CASH', // 'NONE' | 'DEPOSIT_CASH' | 'FULL_CASH'
    notes: '',
  });

  // Formulario de Configuración
  const [settingsForm, setSettingsForm] = useState<Partial<CourtSettings>>({});
  const [savingSettings, setSavingSettings] = useState(false);

  // Login Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'futbol5admin' || passwordInput === process.env.NEXT_PUBLIC_ADMIN_PIN) {
      setIsAuthenticated(true);
      setLoginError(false);
      localStorage.setItem('f5_admin_auth', 'true');
    } else {
      setLoginError(true);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('f5_admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('f5_admin_auth');
  };

  // Cargar datos de la agenda
  const fetchAgenda = () => {
    setLoadingAgenda(true);
    fetch(`/api/slots?date=${selectedDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSlots(data.slots || []);
          setSettings(data.settings || null);
          if (!settingsForm.court_name && data.settings) {
            setSettingsForm(data.settings);
          }
        }
      })
      .finally(() => setLoadingAgenda(false));
  };

  // Cargar transferencias pendientes
  const fetchPendingTransfers = () => {
    setLoadingTransfers(true);
    fetch('/api/admin/bookings?filter=pending_transfers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPendingTransfers(data.bookings || []);
        }
      })
      .finally(() => setLoadingTransfers(false));
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAgenda();
      fetchPendingTransfers();
    }
  }, [isAuthenticated, selectedDate]);

  // Acciones Administrativas
  const executeAdminAction = async (action: string, bookingId: string, extraBody = {}) => {
    try {
      const res = await fetch('/api/admin/bookings/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, bookingId, ...extraBody }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback(data.message || 'Operación completada con éxito.');
        fetchAgenda();
        fetchPendingTransfers();
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        alert(data.error || 'Error ejecutando la acción');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    }
  };

  // Guardar Configuración
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setActionFeedback('Configuración guardada correctamente.');
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } finally {
      setSavingSettings(false);
    }
  };

  // Crear Reserva Manual
  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.customerName.trim() || !manualForm.customerPhone.trim()) {
      alert('Por favor complete el nombre y teléfono del cliente.');
      return;
    }

    await executeAdminAction('MANUAL_BOOKING', '', manualForm);
    setActiveTab('agenda');
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            color: 'var(--pitch-green-light)',
          }}>
            <Lock size={26} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem', color: '#fff', marginBottom: '0.4rem' }}>
            Panel de Mostrador
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            Acceso exclusivo para el personal y administración del complejo.
          </p>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Contraseña del Administrador..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: loginError ? '1px solid #ef4444' : '1px solid var(--stadium-border)',
                borderRadius: '0.75rem',
                padding: '0.85rem 1rem',
                color: '#fff',
                fontSize: '1rem',
                marginBottom: '1rem',
                textAlign: 'center',
              }}
            />
            {loginError && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem' }}>
                Contraseña incorrecta. (Clave por defecto: futbol5admin)
              </p>
            )}
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.85rem' }}>
              Ingresar al Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem 1rem' }}>
      {/* Header del Dashboard */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid var(--stadium-border)',
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--pitch-green-light)', letterSpacing: '0.05em' }}>
            SISTEMA DE ADMINISTRACIÓN Y CONTROL
          </span>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '1.85rem', fontWeight: 900, color: '#fff' }}>
            {settings?.court_name || 'Cancha 1'} • Panel Mostrador
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => { fetchAgenda(); fetchPendingTransfers(); }}
            className="btn-secondary"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
            title="Refrescar datos"
          >
            <RefreshCw size={16} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', color: '#f87171' }}
          >
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--pitch-green-light)',
          padding: '0.75rem 1.25rem',
          borderRadius: '0.75rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '0.9rem',
        }}>
          <CheckCircle2 size={18} />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Tabs de Navegación */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem',
      }}>
        <button
          onClick={() => setActiveTab('agenda')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: activeTab === 'agenda' ? 'var(--pitch-green)' : 'var(--stadium-border)',
            background: activeTab === 'agenda' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'agenda' ? '#fff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CalendarIcon size={18} color={activeTab === 'agenda' ? 'var(--pitch-green)' : '#94a3b8'} />
          <span>Agenda Diaria</span>
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: activeTab === 'transfers' ? 'var(--night-amber)' : 'var(--stadium-border)',
            background: activeTab === 'transfers' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'transfers' ? '#fff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            position: 'relative',
          }}
        >
          <Clock size={18} color={activeTab === 'transfers' ? 'var(--night-amber)' : '#94a3b8'} />
          <span>Transferencias Pendientes</span>
          {pendingTransfers.length > 0 && (
            <span style={{
              background: '#f59e0b',
              color: '#000',
              fontWeight: 900,
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '9999px',
            }}>
              {pendingTransfers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: activeTab === 'manual' ? 'var(--pitch-green)' : 'var(--stadium-border)',
            background: activeTab === 'manual' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'manual' ? '#fff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <PlusCircle size={18} color={activeTab === 'manual' ? 'var(--pitch-green)' : '#94a3b8'} />
          <span>Nueva Reserva en Mostrador</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '0.75rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid',
            borderColor: activeTab === 'settings' ? 'var(--pitch-green)' : 'var(--stadium-border)',
            background: activeTab === 'settings' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
            color: activeTab === 'settings' ? '#fff' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Settings size={18} color={activeTab === 'settings' ? 'var(--pitch-green)' : '#94a3b8'} />
          <span>Configuración de Cancha</span>
        </button>
      </div>

      {/* TAB 1: AGENDA DIARIA */}
      {activeTab === 'agenda' && (
        <div>
          {/* Selector de fecha en agenda */}
          <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  const d = new Date(`${selectedDate}T12:00:00`);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.6rem' }}
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--stadium-border)',
                  color: '#fff',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  fontWeight: 700,
                }}
              />
              <button
                onClick={() => {
                  const d = new Date(`${selectedDate}T12:00:00`);
                  d.setDate(d.getDate() + 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="btn-secondary"
                style={{ padding: '0.4rem 0.6rem' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Total Slots: <strong style={{ color: '#fff' }}>{slots.length}</strong>
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                Ocupados: <strong style={{ color: 'var(--pitch-green-light)' }}>{slots.filter(s => s.status === 'BOOKED' || s.status === 'HOLD').length}</strong>
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                Libres: <strong style={{ color: '#fff' }}>{slots.filter(s => s.status === 'AVAILABLE').length}</strong>
              </span>
            </div>
          </div>

          {/* Grilla / Lista de Slots de la Agenda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {slots.map((slot) => {
              const booking = slot.booking;
              const hasBalanceToCollect = booking && booking.remaining_balance > 0;

              return (
                <div
                  key={slot.start_time}
                  className="glass-card"
                  style={{
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    borderLeft: `5px solid ${
                      slot.status === 'AVAILABLE'
                        ? 'var(--pitch-green)'
                        : slot.status === 'HOLD'
                        ? 'var(--night-amber)'
                        : '#3b82f6'
                    }`,
                  }}
                >
                  {/* Horario y Tipo */}
                  <div style={{ minWidth: '140px' }}>
                    <span style={{ fontFamily: 'var(--font-title)', fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                      {slot.start_time} - {slot.end_time}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: slot.is_night ? 'var(--night-amber)' : 'var(--text-muted)' }}>
                      {slot.is_night ? 'Nocturno (Luz)' : 'Diurno'} • ${slot.price.toLocaleString('es-AR')}
                    </span>
                  </div>

                  {/* Estado y Datos del Cliente */}
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    {booking ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>
                            {booking.customer_name}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 7px',
                            borderRadius: '9999px',
                            background:
                              booking.status === 'CONFIRMED'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : 'rgba(245, 158, 11, 0.2)',
                            color:
                              booking.status === 'CONFIRMED'
                                ? 'var(--pitch-green-light)'
                                : 'var(--night-amber)',
                          }}>
                            {booking.status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <a
                            href={`https://wa.me/${booking.customer_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                          >
                            <Phone size={13} />
                            {booking.customer_phone}
                          </a>
                          <span>#{booking.booking_number}</span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--pitch-green-light)', fontWeight: 600, fontSize: '0.9rem' }}>
                        Turno Disponible
                      </span>
                    )}
                  </div>

                  {/* Saldos Financieros */}
                  {booking && (
                    <div style={{ minWidth: '170px', textAlign: 'right' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                        Abonado: <strong style={{ color: 'var(--pitch-green-light)' }}>${booking.paid_amount.toLocaleString('es-AR')}</strong>
                      </span>
                      <span style={{ fontSize: '0.85rem', color: hasBalanceToCollect ? '#fbbf24' : 'var(--pitch-green-light)', fontWeight: 800 }}>
                        {hasBalanceToCollect ? `Resta: $${booking.remaining_balance.toLocaleString('es-AR')}` : 'Saldado 100%'}
                      </span>
                    </div>
                  )}

                  {/* Acciones */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {slot.status === 'AVAILABLE' ? (
                      <button
                        onClick={() => {
                          setManualForm((prev) => ({
                            ...prev,
                            bookingDate: selectedDate,
                            startTime: slot.start_time,
                            endTime: slot.end_time,
                          }));
                          setActiveTab('manual');
                        }}
                        className="btn-primary"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                      >
                        <PlusCircle size={15} />
                        Reservar en Mostrador
                      </button>
                    ) : booking ? (
                      <>
                        {hasBalanceToCollect && (
                          <button
                            onClick={() => {
                              setCollectBalanceModal(booking);
                              setCollectAmount(booking.remaining_balance);
                            }}
                            className="btn-primary"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                          >
                            <DollarSign size={15} />
                            Cobrar Saldo
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (confirm(`¿Seguro que desea cancelar la reserva #${booking.booking_number}?`)) {
                              executeAdminAction('CANCEL_BOOKING', booking.id);
                            }
                          }}
                          className="btn-secondary"
                          style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem', color: '#f87171' }}
                          title="Cancelar reserva"
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BANDEJA DE TRANSFERENCIAS */}
      {activeTab === 'transfers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.35rem', color: '#fff', fontWeight: 800 }}>
              Comprobantes Pendientes de Validación ({pendingTransfers.length})
            </h2>
          </div>

          {pendingTransfers.length === 0 ? (
            <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <CheckCircle2 size={42} color="var(--pitch-green)" style={{ margin: '0 auto 1rem auto' }} />
              <h3 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>No hay transferencias pendientes</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Todos los pagos por transferencia han sido revisados y procesados.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingTransfers.map((b) => {
                const pendingPayment = b.payments?.find((p: any) => p.status === 'PENDING') || b.payments?.[0];
                const receiptUrl = pendingPayment?.receipt_url;

                return (
                  <div key={b.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1.1rem', color: '#fff' }}>
                          #{b.booking_number}
                        </span>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--night-amber)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                          PENDIENTE DE REVISIÓN
                        </span>
                      </div>
                      <p style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                        {b.customer_name} • <span style={{ color: '#38bdf8' }}>{b.customer_phone}</span>
                      </p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                        Partido: <strong>{b.booking_date}</strong> a las <strong>{b.start_time} hs</strong>
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Monto declarado a aprobar: <strong style={{ color: 'var(--pitch-green-light)' }}>${b.deposit_amount?.toLocaleString('es-AR')}</strong>
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      {receiptUrl ? (
                        <button
                          onClick={() => setSelectedReceiptUrl(receiptUrl)}
                          className="btn-secondary"
                          style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                        >
                          <Eye size={16} />
                          Ver Comprobante
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sin archivo adjunto</span>
                      )}

                      <button
                        onClick={() => executeAdminAction('APPROVE_TRANSFER', b.id)}
                        className="btn-primary"
                        style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}
                      >
                        <CheckCircle2 size={16} />
                        Aprobar Pago
                      </button>

                      <button
                        onClick={() => {
                          const reason = prompt('Ingrese el motivo del rechazo:');
                          if (reason !== null) {
                            executeAdminAction('REJECT_TRANSFER', b.id, { reason });
                          }
                        }}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#f87171' }}
                      >
                        <XCircle size={16} />
                        Rechazar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RESERVA MANUAL MOSTRADOR */}
      {activeTab === 'manual' && (
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '1.25rem' }}>
              Tomar Reserva Directa en Mostrador
            </h2>

            <form onSubmit={handleCreateManualBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={manualForm.bookingDate}
                    onChange={(e) => setManualForm({ ...manualForm, bookingDate: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--stadium-border)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      color: '#fff',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                    Hora de Inicio
                  </label>
                  <input
                    type="text"
                    value={manualForm.startTime}
                    onChange={(e) => {
                      const start = e.target.value;
                      const [h] = start.split(':').map(Number);
                      const end = `${(h + 1).toString().padStart(2, '0')}:00`;
                      setManualForm({ ...manualForm, startTime: start, endTime: end });
                    }}
                    placeholder="20:00"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--stadium-border)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      color: '#fff',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Nombre y Apellido del Cliente *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Marcos Rojo"
                  value={manualForm.customerName}
                  onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--stadium-border)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  placeholder="Ej: 1123456789"
                  value={manualForm.customerPhone}
                  onChange={(e) => setManualForm({ ...manualForm, customerPhone: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--stadium-border)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    color: '#fff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Cobro en Mostrador Ahora
                </label>
                <select
                  value={manualForm.paymentOption}
                  onChange={(e) => setManualForm({ ...manualForm, paymentOption: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--stadium-border)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    color: '#fff',
                  }}
                >
                  <option value="NONE" style={{ background: '#111827' }}>Sin cobrar seña (Abona todo en cancha antes de jugar)</option>
                  <option value="DEPOSIT_CASH" style={{ background: '#111827' }}>Cobrar Seña en Efectivo Ahora (30%)</option>
                  <option value="FULL_CASH" style={{ background: '#111827' }}>Cobrar 100% Total en Efectivo Ahora</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Notas internas
                </label>
                <input
                  type="text"
                  placeholder="Ej: Turno fijo semanal / Pidieron chalecos"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--stadium-border)',
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    color: '#fff',
                  }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', padding: '0.85rem' }}>
                Confirmar y Registrar Reserva
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: CONFIGURACIÓN DE CANCHA */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <h2 style={{ fontFamily: 'var(--font-title)', fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem' }}>
              Configuración Operativa de la Cancha
            </h2>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Nombre del Complejo / Cancha
                </label>
                <input
                  type="text"
                  value={settingsForm.court_name || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, court_name: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--stadium-border)', borderRadius: '0.5rem', padding: '0.75rem', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                    Tarifa Diurna ($/hora)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.day_price || 0}
                    onChange={(e) => setSettingsForm({ ...settingsForm, day_price: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--stadium-border)', borderRadius: '0.5rem', padding: '0.75rem', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                    Tarifa Nocturna con Luz ($/hora)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.night_price || 0}
                    onChange={(e) => setSettingsForm({ ...settingsForm, night_price: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--stadium-border)', borderRadius: '0.5rem', padding: '0.75rem', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                    Porcentaje de Seña Requerido (%)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.deposit_value || 30}
                    onChange={(e) => setSettingsForm({ ...settingsForm, deposit_value: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--stadium-border)', borderRadius: '0.5rem', padding: '0.75rem', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                    Tiempo de Bloqueo Temporal (Minutos)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.hold_timeout_minutes || 20}
                    onChange={(e) => setSettingsForm({ ...settingsForm, hold_timeout_minutes: Number(e.target.value) })}
                    style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--stadium-border)', borderRadius: '0.5rem', padding: '0.75rem', color: '#fff' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Alias Bancario para Transferencias
                </label>
                <input
                  type="text"
                  value={settingsForm.bank_alias || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bank_alias: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--stadium-border)', borderRadius: '0.5rem', padding: '0.75rem', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  CBU / CVU Bancario
                </label>
                <input
                  type="text"
                  value={settingsForm.bank_cbu || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bank_cbu: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--stadium-border)', borderRadius: '0.5rem', padding: '0.75rem', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                  Titular de la Cuenta
                </label>
                <input
                  type="text"
                  value={settingsForm.bank_holder || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, bank_holder: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--stadium-border)', borderRadius: '0.5rem', padding: '0.75rem', color: '#fff' }}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={savingSettings} style={{ marginTop: '0.5rem', padding: '0.85rem' }}>
                <Save size={18} />
                <span>{savingSettings ? 'Guardando...' : 'Guardar Cambios de Configuración'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COBRAR SALDO EN MOSTRADOR */}
      {collectBalanceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 100,
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-title)', fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Cobrar Saldo en Mostrador
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Reserva #{collectBalanceModal.booking_number} • {collectBalanceModal.customer_name}
            </p>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Valor Total:</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>${collectBalanceModal.total_amount.toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Seña Abonada:</span>
                <span style={{ color: 'var(--pitch-green-light)', fontWeight: 700 }}>${collectBalanceModal.paid_amount.toLocaleString('es-AR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderTop: '1px solid var(--stadium-border)', paddingTop: '0.5rem' }}>
                <span style={{ color: '#fff', fontWeight: 800 }}>Saldo Pendiente:</span>
                <span style={{ color: '#fbbf24', fontWeight: 900 }}>${collectBalanceModal.remaining_balance.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.4rem' }}>
                Monto a Cobrar en Efectivo / Débito:
              </label>
              <input
                type="number"
                value={collectAmount}
                onChange={(e) => setCollectAmount(Number(e.target.value))}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--stadium-border)',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  color: '#fff',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setCollectBalanceModal(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  executeAdminAction('COLLECT_BALANCE', collectBalanceModal.id, { amount: collectAmount });
                  setCollectBalanceModal(null);
                }}
                className="btn-primary"
                style={{ flex: 2 }}
              >
                Confirmar Cobro ($ {collectAmount.toLocaleString('es-AR')})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER COMPROBANTE DE TRANSFERENCIA */}
      {selectedReceiptUrl && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 100,
        }}>
          <div className="glass-card" style={{ maxWidth: '600px', width: '100%', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>Comprobante de Transferencia</h3>
              <button onClick={() => setSelectedReceiptUrl(null)} className="btn-secondary" style={{ padding: '0.35rem 0.65rem' }}>
                Cerrar
              </button>
            </div>

            <div style={{ maxHeight: '70vh', overflowY: 'auto', background: '#000', borderRadius: '0.5rem', padding: '0.5rem', marginBottom: '1rem' }}>
              {selectedReceiptUrl.endsWith('.pdf') ? (
                <a href={selectedReceiptUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  <ExternalLink size={16} /> Abrir PDF en pestaña nueva
                </a>
              ) : (
                <img
                  src={selectedReceiptUrl}
                  alt="Comprobante"
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '0.25rem' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
