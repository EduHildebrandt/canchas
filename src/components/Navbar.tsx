import Link from 'next/link';
import { Calendar, ShieldCheck, Clock, MapPin } from 'lucide-react';

export default function Navbar() {
  return (
    <header style={{
      borderBottom: '1px solid var(--stadium-border)',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '74px',
      }}>
        {/* Brand */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px var(--pitch-glow)',
            color: '#fff',
            fontWeight: 900,
            fontSize: '1.25rem',
            fontFamily: 'var(--font-title)',
          }}>
            F5
          </div>
          <div>
            <span style={{
              display: 'block',
              fontFamily: 'var(--font-title)',
              fontSize: '1.2rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              lineHeight: 1.1,
            }}>
              CANCHA PRO <span style={{ color: 'var(--pitch-green-light)' }}>F5</span>
            </span>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--pitch-green)', display: 'inline-block' }}></span>
              Césped Sintético Monofilamento Pro
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link
            href="/"
            style={{
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              transition: 'background 0.2s',
            }}
          >
            <Calendar size={16} color="var(--pitch-green)" />
            Turnos Disponibles
          </Link>

          <Link
            href="/reserva/buscar"
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              transition: 'color 0.2s',
            }}
          >
            Buscar Mi Reserva
          </Link>

          <Link
            href="/admin"
            className="btn-secondary"
            style={{
              fontSize: '0.85rem',
              padding: '0.5rem 1rem',
            }}
          >
            <ShieldCheck size={16} color="#94a3b8" />
            Acceso Mostrador
          </Link>
        </nav>
      </div>
    </header>
  );
}
