import { MapPin, Phone, CreditCard, Shield, Clock } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--stadium-border)',
      background: 'rgba(9, 13, 22, 0.95)',
      marginTop: 'auto',
      padding: '3rem 0 2rem 0',
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2.5rem',
          marginBottom: '2.5rem',
        }}>
          {/* Columna 1 */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.8rem', color: '#fff' }}>
              CANCHA PRO F5
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
              Instalaciones de alto rendimiento. Césped sintético homologado de última generación, iluminación LED profesional y vestuarios climatizados.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--pitch-green)', fontSize: '0.85rem' }}>
              <Clock size={16} />
              <span>Abierto todos los días de 09:00 a 00:00 hs</span>
            </div>
          </div>

          {/* Columna 2: Ubicación & Contacto */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1rem', fontWeight: 700, marginBottom: '0.8rem', color: '#fff' }}>
              Ubicación & Contacto
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="#94a3b8" />
                Av. del Deporte 1250, Cancha 1
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} color="#94a3b8" />
                +54 9 11 4050-7080 (WhatsApp)
              </li>
            </ul>
          </div>

          {/* Columna 3: Métodos de Pago */}
          <div>
            <h4 style={{ fontFamily: 'var(--font-title)', fontSize: '1rem', fontWeight: 700, marginBottom: '0.8rem', color: '#fff' }}>
              Formas de Pago
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Asegurá tu turno abonando la seña mínima o el total con:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{
                background: 'rgba(0, 158, 227, 0.15)',
                color: '#38bdf8',
                padding: '0.35rem 0.65rem',
                borderRadius: '0.5rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: '1px solid rgba(0, 158, 227, 0.3)',
              }}>
                Mercado Pago
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                padding: '0.35rem 0.65rem',
                borderRadius: '0.5rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}>
                Transferencia Bancaria
              </span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                padding: '0.35rem 0.65rem',
                borderRadius: '0.5rem',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}>
                Efectivo en Mostrador
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--stadium-border)',
          paddingTop: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
        }}>
          <p>© {new Date().getFullYear()} Cancha Pro F5. Todos los derechos reservados.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={14} color="var(--pitch-green)" />
            <span>Reservas seguras con bloqueo temporal anti-colisión</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
