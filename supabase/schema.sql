-- ==============================================================================
-- Esquema de Base de Datos para Sistema de Cancha de Fútbol 5
-- Compatible con PostgreSQL y Supabase
-- ==============================================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Configuración de la Cancha
CREATE TABLE IF NOT EXISTS court_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_name VARCHAR(150) NOT NULL DEFAULT 'Cancha 1 - Césped Sintético Pro',
    opening_time TIME NOT NULL DEFAULT '09:00',
    closing_time TIME NOT NULL DEFAULT '24:00',
    slot_duration_minutes INTEGER NOT NULL DEFAULT 60,
    day_price NUMERIC(10, 2) NOT NULL DEFAULT 24000.00,
    night_price NUMERIC(10, 2) NOT NULL DEFAULT 30000.00,
    night_start_time TIME NOT NULL DEFAULT '18:00',
    deposit_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE' CHECK (deposit_type IN ('PERCENTAGE', 'FIXED')),
    deposit_value NUMERIC(10, 2) NOT NULL DEFAULT 30.00, -- 30% o monto fijo
    bank_alias VARCHAR(100) NOT NULL DEFAULT 'cancha.futbol5.mp',
    bank_cbu VARCHAR(50) NOT NULL DEFAULT '0000003100012345678901',
    bank_holder VARCHAR(150) NOT NULL DEFAULT 'Complejo Deportivo Fútbol 5 S.A.',
    bank_name VARCHAR(100) NOT NULL DEFAULT 'Mercado Pago / Banco Galicia',
    hold_timeout_minutes INTEGER NOT NULL DEFAULT 20,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar configuración por defecto si la tabla está vacía
INSERT INTO court_settings (
    court_name, opening_time, closing_time, slot_duration_minutes, 
    day_price, night_price, night_start_time, deposit_type, deposit_value,
    bank_alias, bank_cbu, bank_holder, bank_name, hold_timeout_minutes
)
SELECT 
    'Cancha 1 - Césped Sintético Pro', '09:00', '24:00', 60,
    24000.00, 30000.00, '18:00', 'PERCENTAGE', 30.00,
    'cancha.futbol5.mp', '0000003100012345678901', 'Complejo Deportivo Fútbol 5', 'Mercado Pago', 20
WHERE NOT EXISTS (SELECT 1 FROM court_settings);

-- 2. Tabla de Reservas
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(20) UNIQUE NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    deposit_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    remaining_balance NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'HOLD' CHECK (status IN ('HOLD', 'PENDING_APPROVAL', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PARTIAL_PAID', 'PAID_FULL', 'REFUNDED')),
    payment_method VARCHAR(30) CHECK (payment_method IN ('MERCADOPAGO', 'TRANSFERENCIA', 'EFECTIVO')),
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de búsqueda y concurrencia
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings (booking_date, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_expires ON bookings (expires_at);

-- 3. Tabla de Pagos
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('MERCADOPAGO', 'TRANSFERENCIA', 'EFECTIVO')),
    payment_type VARCHAR(30) NOT NULL CHECK (payment_type IN ('DEPOSIT_PARTIAL', 'FULL_PAYMENT', 'REMAINING_BALANCE')),
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    mp_payment_id VARCHAR(100),
    mp_preference_id VARCHAR(150),
    receipt_url TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_payment_id ON payments (mp_payment_id);

-- 4. Función de auto-liberación de turnos expirados en estado HOLD
CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS void AS $$
BEGIN
    UPDATE bookings
    SET status = 'CANCELLED',
        notes = COALESCE(notes, '') || ' [Expirado automáticamente por tiempo sin pago]'
    WHERE status = 'HOLD'
      AND expires_at IS NOT NULL
      AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
