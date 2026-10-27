import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Cancha Pro F5 | Sistema de Reservas y Gestión',
  description: 'Reservá tu turno en nuestra cancha de fútbol 5 con césped sintético profesional. Pagá la seña o el total por Mercado Pago o Transferencia Bancaria.',
  keywords: 'cancha futbol 5, reservas futbol 5, alquiler de canchas, futbol f5',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
