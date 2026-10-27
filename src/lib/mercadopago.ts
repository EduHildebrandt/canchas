// ==============================================================================
// Cliente Mercado Pago usando REST API nativa con Fetch (Zero external dependencies)
// ==============================================================================

const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';

export const isMercadoPagoConfigured = Boolean(
  mpAccessToken && !mpAccessToken.startsWith('TEST-000000') && mpAccessToken.length > 10
);

interface CreatePreferenceParams {
  bookingId: string;
  bookingNumber: string;
  title: string;
  amount: number;
  customerEmail: string;
  customerName: string;
}

export interface MPPreferenceResponse {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface MPPaymentDetails {
  id: number;
  status: 'approved' | 'pending' | 'in_process' | 'rejected' | 'cancelled' | 'refunded';
  status_detail: string;
  transaction_amount: number;
  external_reference: string;
  date_approved: string | null;
}

/**
 * Crea una preferencia de pago en Mercado Pago Checkout Pro
 */
export async function createBookingPreference({
  bookingId,
  bookingNumber,
  title,
  amount,
  customerEmail,
  customerName,
}: CreatePreferenceParams): Promise<MPPreferenceResponse> {
  if (!mpAccessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado en las variables de entorno.');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const body = {
    items: [
      {
        id: bookingId,
        title: `${title} (#${bookingNumber})`,
        quantity: 1,
        unit_price: Number(amount),
        currency_id: 'ARS',
      },
    ],
    payer: {
      email: customerEmail,
      name: customerName,
    },
    external_reference: bookingId,
    back_urls: {
      success: `${appUrl}/reserva/confirmacion/${bookingId}?status=success`,
      pending: `${appUrl}/reserva/confirmacion/${bookingId}?status=pending`,
      failure: `${appUrl}/reserva/confirmacion/${bookingId}?status=failure`,
    },
    auto_return: 'approved',
    notification_url: `${appUrl}/api/webhooks/mercadopago`,
    statement_descriptor: 'CANCHA FUTBOL 5',
  };

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${mpAccessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Error en Mercado Pago API (${response.status}): ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
  };
}

/**
 * Consulta el estado de un pago específico en la API de Mercado Pago
 */
export async function getPaymentDetails(paymentId: string | number): Promise<MPPaymentDetails> {
  if (!mpAccessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado.');
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${mpAccessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`No se pudo consultar el pago ${paymentId} en Mercado Pago.`);
  }

  return response.json();
}
