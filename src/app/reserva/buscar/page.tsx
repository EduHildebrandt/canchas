'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Calendar, Clock, ArrowRight, AlertCircle, Ticket } from 'lucide-react';

export default function SearchBookingPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/bookings/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success) {
        setResults(data.bookings || []);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '3.5rem 1rem 5rem 1rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem' }}>
            Consultar Mi Reserva
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Ingresá tu número de reserva (ej: <strong>F5-1049</strong>) o el número de teléfono/WhatsApp con el que reservaste.
          </p>
        </div>

        {/* Buscador */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <input
            type="text"
            placeholder="Número de reserva (F5-...) o Teléfono..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--stadium-border)',
              borderRadius: '0.75rem',
              padding: '0.85rem 1.25rem',
              color: '#fff',
              fontSize: '1rem',
            }}
          />
          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.85rem 1.5rem' }}>
            <Search size={18} />
            <span>{loading ? 'Buscando...' : 'Buscar'}</span>
          </button>
        </form>

        {/* Resultados */}
        {hasSearched && (
          <div>
            {results.length === 0 ? (
              <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                <AlertCircle size={36} color="#94a3b8" style={{ margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.35rem' }}>No se encontraron reservas</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Verificá que el número de reserva o teléfono esté escrito correctamente.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {results.map((b) => (
                  <Link
                    key={b.id}
                    href={`/reserva/confirmacion/${b.id}`}
                    className="glass-card-interactive"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1.25rem 1.5rem',
                      textDecoration: 'none',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <Ticket size={16} color="var(--pitch-green)" />
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#fff', fontSize: '1rem' }}>
                          #{b.booking_number}
                        </span>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '9999px',
                          background: b.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: b.status === 'CONFIRMED' ? 'var(--pitch-green-light)' : 'var(--night-amber)',
                        }}>
                          {b.status === 'CONFIRMED' ? 'Confirmado' : b.status === 'PENDING_APPROVAL' ? 'En Revisión' : b.status}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {b.customer_name} • {b.booking_date} • {b.start_time} hs
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Abonado: ${b.paid_amount?.toLocaleString('es-AR')} • Saldo: ${b.remaining_balance?.toLocaleString('es-AR')}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--pitch-green-light)', fontWeight: 700, fontSize: '0.85rem' }}>
                      <span>Ver Voucher</span>
                      <ArrowRight size={16} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
