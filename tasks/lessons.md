# Lecciones Aprendidas y Patrones de Arquitectura (tasks/lessons.md)

Este documento registra los patrones arquitectónicos críticos, problemas de entorno resueltos y decisiones de diseño implementadas durante el desarrollo del sistema de reservas de Fútbol 5.

---

## 1. Entorno de Ejecución en Unidades Virtuales (Google Drive / `Z:\`)
- **Problema Detectado**: Ejecutar comandos como `npm install` masivos dentro del montaje virtual de Google Drive (`Z:\Mi unidad\...`) produce bloqueos de archivos por parte del proceso de sincronización en la nube (`TAR_ENTRY_ERROR EBADF` o `EPERM: operation not permitted`).
- **Regla & Solución**: 
  - Evitar paquetes npm voluminosos o innecesarios cuando se puede implementar la solución de forma nativa.
  - Para Mercado Pago, usar llamadas nativas con `fetch` contra los endpoints de la API REST oficial (`https://api.mercadopago.com/checkout/preferences`) en lugar del SDK pesado `mercadopago`. Esto garantiza cero dependencias vulnerables a locks de archivos, menor latencia y portabilidad total.
  - Cuando se requiera descargar paquetes o scripts temporales, utilizar el directorio de almacenamiento temporal del sistema local (`%TEMP%`) y no saturar la carpeta de sincronización continua.
  - Aprovechar Node 24 (`node --experimental-strip-types`) para ejecutar scripts de validación y utilitarios TypeScript sin requerir transpilación o herramientas pesadas como `ts-node` o `tsx`.

---

## 2. Prevención de Colisiones de Turnos (Anti-Concurrency Safe)
- **Problema**: Dos usuarios seleccionando simultáneamente el horario de mayor demanda (ej. 21:00 hs viernes) e iniciando el pago a la vez.
- **Patrón Aplicado**:
  - **Bloqueo `HOLD` Transitorio**: Cuando el cliente avanza al checkout, se crea inmediatamente un registro en estado `HOLD` con un timestamp de expiración a 20 minutos (`expires_at`).
  - **Doble Verificación Atómica**: Antes de insertar el `HOLD`, se evalúa si ya existe otro registro en `CONFIRMED`, `PENDING_APPROVAL` o `HOLD` con `expires_at > NOW()`.
  - **Lazy & Cron Auto-Release**: Se implementa un procedimiento de auto-liberación (`releaseExpiredHolds`) que corre de manera periódica y también antes de calcular la grilla de disponibilidad del día, garantizando que los turnos abandonados vuelvan automáticamente a la oferta pública.

---

## 3. Imputación de Pagos Parciales (Seña) vs Pago Completo
- **Patrón de Negocio**:
  - `total_amount`: Tarifa calculada según horario (Diurno $24.000 vs Nocturno $30.000 a partir de las 18:00 hs con iluminación).
  - `deposit_amount`: Porcentaje de seña configurable (por defecto 30%).
  - Al abonar seña vía Mercado Pago o Transferencia, la reserva pasa a estado `CONFIRMED` y `payment_status = PARTIAL_PAID`.
  - Se mantiene explícito el campo `remaining_balance = total_amount - paid_amount` para la liquidación final presencial en el mostrador antes del pitazo inicial.

---

## 4. Estrategia de Fallback Resiliente (Dual Engine DB)
- **Patrón de Base de Datos**:
  - El sistema cuenta con soporte primario para Supabase / PostgreSQL con esquemas relacionales, constraints de unicidad y RLS.
  - Se integró un **In-Memory & JSON Resilient Storage** automático en los servicios (`src/services/`) que se activa cuando las credenciales de Supabase no están configuradas en `.env.local`.
  - Esto asegura que el sistema funcione perfectamente de forma local y en entornos de staging/testing sin romper la experiencia del desarrollador o del evaluador.

---

## 5. Diseño y Experiencia de Usuario (UX Deportivo / Glassmorphism)
- **Paleta de Identidad**: Estética nocturna de estadio (fondo oscuro degradado con acentos verde césped `#10b981` y acentos ámbar `#f59e0b` para horarios nocturnos con luz artificial).
- **Voucher Compartible por WhatsApp**: Generación de mensaje codificado para compartir la reserva y el saldo a pagar con el grupo de amigos en un solo toque.
