# Tareas de Implementación (TODO) - Sistema Cancha Fútbol 5

## Fase 1: Arquitectura de Datos y Configuración
- [x] Definir variables de entorno (`.env.example`) para Supabase y Mercado Pago
- [x] Crear tipos TypeScript para el dominio (`Booking`, `Payment`, `CourtSettings`, `TimeSlot`)
- [x] Crear migración SQL / esquema para Supabase (`court_settings`, `bookings`, `payments`)
- [x] Configurar clientes singleton para Supabase y SDK de Mercado Pago

## Fase 2: Motor de Turnos y Bloqueo Concurrente
- [x] Implementar utilitario de cálculo de slots por franja horaria según configuración de cancha
- [x] Crear Server Action / API para solicitar turno con bloqueo temporal (`HOLD` 20 min)
- [x] Crear mecanismo de auto-liberación para reservas expiradas sin comprobante/pago

## Fase 3: Frontend del Cliente (Reserva y Checkout)
- [x] Implementar vista de selección de fecha y grilla de horarios disponibles
- [x] Implementar modal interactivo de reserva (datos de contacto + selector Seña vs Total)
- [x] Implementar checkout Mercado Pago (generación de preferencia y redirección/modal)
- [x] Implementar checkout Transferencia Bancaria (copiar Alias/CBU, timer de 20 min y carga de comprobante)
- [x] Implementar página de Voucher / Confirmación con detalle de pago y saldo restante

## Fase 4: Webhooks y Lógica de Imputación de Pagos
- [x] Implementar Route Handler `/api/webhooks/mercadopago`
- [x] Implementar actualización de reservas (`PARTIAL_PAID` o `PAID_FULL`) tras confirmación de MP
- [x] Implementar endpoint/Storage para subida de comprobantes de transferencia (`/api/receipts/upload`)

## Fase 5: Panel de Administración (Backoffice)
- [x] Crear vista de Agenda / Calendario diario y semanal interactivo
- [x] Crear modal de reserva manual directa para el mostrador
- [x] Crear bandeja de revisión de comprobantes de transferencia (Aprobar / Rechazar)
- [x] Crear acción de cobro y conciliación de saldo en efectivo/mostrador
- [x] Crear vista de configuración de precios, horarios y seña

## Fase 6: Verificación y Auditoría
- [x] Probar flujo completo de reserva con Seña vía Mercado Pago
- [x] Probar flujo completo de reserva con Transferencia y aprobación manual
- [x] Validar estados Empty, Loading y Error en todas las pantallas
- [x] Documentar aprendizajes en `tasks/lessons.md`
