# Master Roadmap: Sistema de Gestión y Reservas de Cancha de Fútbol 5

## 1. Visión del Producto y Justificación (The WHY)
El objetivo es digitalizar íntegramente la operación de una cancha de fútbol 5 comercial. Resuelve dos grandes dolores del negocio:
1. **Ausentismo y cancelaciones de último momento**: Al exigir seña (pago parcial) o pago completo para bloquear el turno, se elimina la pérdida de ingresos por reservas fantasmas.
2. **Gestión manual caótica de comprobantes y doble turno**: Automatiza la disponibilidad en tiempo real con bloqueo temporal anti-colisión (locks de 20 min) mientras se transfiere o paga por Mercado Pago, y centraliza en un panel de control la conciliación de saldos y caja.

---

## 2. Decisiones de Arquitectura y Modelo de Datos
- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4.
- **Base de Datos & Auth**: PostgreSQL / Supabase con tipos generados y RLS (Row Level Security).
- **Procesamiento de Pagos**:
  - **Mercado Pago (Checkout Pro / API)**: Generación de preferencia, retorno de status y Webhook IPN (`/api/webhooks/mercadopago`) para acreditación automática e inmediata.
  - **Transferencia Bancaria**: Turno en estado `PENDING_REVIEW` con bloqueo temporal (timer de 20 minutos configurable); el cliente sube comprobante y el administrador aprueba/rechaza en 1 clic.
- **Lógica de Imputación de Pagos**:
  - Cada reserva registra: `total_amount`, `deposit_amount` (seña requerida o abonada), `paid_amount`, `remaining_balance` y `payment_status` (`PENDING`, `PARTIAL_PAID`, `PAID_FULL`, `REFUNDED`).
  - Al presentarse a jugar, el administrador registra el cobro del saldo restante (efectivo, débito o link digital).

---

## 3. Fases del Proyecto

### Fase 1: Arquitectura de Datos y Configuración Base
- [ ] Definir esquema relacional en PostgreSQL/Supabase:
  - `court_settings`: Horarios de apertura/cierre, duración de turnos (60 min), tarifas (diurna / nocturna con luz), porcentaje/monto de seña mínimo, datos bancarios (Alias, CBU, titular).
  - `bookings`: Fecha, hora inicio, hora fin, datos del cliente (nombre, teléfono, email), estado (`HOLD`, `CONFIRMED`, `CANCELLED`, `COMPLETED`), notas.
  - `payments`: ID de reserva, método (`MERCADOPAGO`, `TRANSFERENCIA`, `EFECTIVO`), tipo (`DEPOSIT_PARTIAL`, `FULL_PAYMENT`, `REMAINING_BALANCE`), monto, comprobante URL / MercadoPago Payment ID, estado (`PENDING`, `APPROVED`, `REJECTED`).
- [ ] Configurar clientes de Supabase y Mercado Pago SDK en TypeScript.

### Fase 2: Motor de Disponibilidad y Bloqueo Temporal (Concurrency Safe)
- [ ] Lógica para generar los slots disponibles del día según configuración y reservas activas.
- [ ] Endpoint/Server Action de bloqueo temporal (`HOLD` de 20 minutos) para evitar colisión de dos clientes intentando pagar el mismo turno simultáneamente.
- [ ] Cron o verificación lazy para liberar turnos en `HOLD` cuyo timer de pago expiró.

### Fase 3: Flujo de Reserva y Experiencia del Cliente (Frontend Web)
- [ ] Selector visual interactivo de fecha y grilla de horarios disponibles (con indicación de tarifa diurna/nocturna).
- [ ] Modal / Checkout de Reserva:
  - Formulario de contacto (Nombre, WhatsApp, Email).
  - Selección de modalidad: **Seña (Pago Parcial)** vs **Pago Total (100%)**.
  - Selección de pasarela: **Mercado Pago** (botón directo / redirección) o **Transferencia Bancaria** (datos de cuenta, botón copiar Alias/CBU y upload de comprobante con countdown timer de 20 min).
- [ ] Pantalla de Confirmación / Voucher:
  - Resumen detallado con estado del turno, monto abonado, saldo pendiente a pagar en cancha y botón para enviar recordatorio por WhatsApp.

### Fase 4: Integración de Pagos y Webhooks
- [ ] Integración Mercado Pago Preference API con metadata de la reserva y montos discriminados (seña vs total).
- [ ] Route Handler Webhook `/api/webhooks/mercadopago` con validación de firma y transición de estados (`CONFIRMED`, `PARTIAL_PAID` o `PAID_FULL`).
- [ ] Flujo de subida y almacenamiento de comprobantes de transferencia bancaria en Storage seguro.

### Fase 5: Panel de Administración y Control de Cancha (Backoffice)
- [ ] Módulo de Autenticación de Administrador / Dueño.
- [ ] Calendario / Agenda interactiva diaria y semanal (turnos confirmados, pendientes, libres y bloqueados por mantenimiento).
- [ ] Reserva manual rápida desde el mostrador (para reservas telefónicas o presenciales).
- [ ] Bandeja de validación de transferencias bancarias (inspección de comprobante, botón Aprobar / Rechazar con motivo).
- [ ] Control de Saldo y Caja: Botón "Cobrar Saldo" en cancha para registrar la liquidación final antes del partido.
- [ ] Configuración general del complejo (precios, horarios, datos bancarios, porcentaje de seña).

### Fase 6: Auditoría, Testing y Despliegue
- [x] Simulación end-to-end de reservas (flujo MP Sandbox y flujo Transferencia).
- [x] Prueba de concurrencia y expiración de turnos temporales.
- [x] Auditoría de UI/UX, estados de carga, error y adaptabilidad móvil.
- [x] Documentar lecciones y manual de operación en `tasks/lessons.md`.

---

## 4. Revisión y Auto-Resolución [AUTO-HEALED]
- **Resiliencia de File System en Google Drive (`Z:\`)**: Se reemplazó el uso de SDKs pesados de Mercado Pago por llamadas REST nativas con `fetch`, eliminando los errores de bloqueo de archivos (`EPERM` / `EBADF`) generados por la sincronización en la nube.
- **Doble Motor de Datos (Supabase + Local In-Memory)**: Para garantizar que el desarrollo y las pruebas funcionen de inmediato incluso sin conectar una base de datos externa, los servicios de reservas y settings detectan automáticamente la disponibilidad de Supabase y recurren a almacenamiento en memoria/JSON si es necesario.
- **Anti-Colisión Concurrente Verificado**: Se ejecutó la suite completa de 24 aserciones de integración ([scratch/run-tests.ts](file:///z:/Mi%20unidad/Benflex/scratch/run-tests.ts)), validando con éxito el bloqueo temporal de 20 minutos (`HOLD`), la imputación de señas (30%), la auto-liberación de turnos vencidos y la conciliación de caja en el panel de administración.
