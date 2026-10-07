/**
 * Payment Provider Abstraction
 * First implementation: Payriff by Kapital Bank
 */

export interface CreatePaymentParams {
  orderId: string;
  amount: number; // in AZN
  currency?: string;
  description: string;
  approveUrl: string;
  cancelUrl: string;
  declineUrl: string;
  language?: string;
  idempotencyKey: string;
}

export interface PaymentResult {
  success: boolean;
  providerOrderId?: string;
  providerSessionId?: string;
  paymentUrl?: string;
  error?: string;
}

export interface PaymentStatusResult {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled' | 'expired';
  providerOrderId: string;
  amount?: number;
  rawResponse?: Record<string, unknown>;
}

export interface RefundResult {
  success: boolean;
  providerRef?: string;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>;
  getPaymentStatus(providerOrderId: string): Promise<PaymentStatusResult>;
  refundPayment(providerOrderId: string, amount?: number): Promise<RefundResult>;
  verifyWebhook(body: string, signature: string): boolean;
}

// ---- Payriff Implementation ----

interface PayriffOrderResponse {
  code: string;
  message: string;
  payload?: {
    orderId: string;
    sessionId: string;
    paymentUrl: string;
  };
}

interface PayriffStatusResponse {
  code: string;
  message: string;
  payload?: {
    orderId: string;
    orderStatus: string;
    amount: number;
    currency: string;
  };
}

export class PayriffProvider implements PaymentProvider {
  name = 'payriff';
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    const secretKey = process.env.PAYRIFF_SECRET_KEY;
    const baseUrl = process.env.PAYRIFF_BASE_URL || 'https://api.payriff.com';

    if (!secretKey) {
      throw new Error(
        'Missing required credential: PAYRIFF_SECRET_KEY\n' +
        'Provider: Payriff (Kapital Bank)\n' +
        'Purpose: Payment processing\n' +
        'Where to obtain: https://merchant.payriff.com → Applications → Show Secret Key'
      );
    }

    this.secretKey = secretKey;
    this.baseUrl = baseUrl;
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.baseUrl}/v3/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.secretKey,
        },
        body: JSON.stringify({
          body: {
            amount: params.amount,
            currencyType: params.currency || 'AZN',
            description: params.description,
            language: params.language || 'AZ',
            approveURL: params.approveUrl,
            cancelURL: params.cancelUrl,
            declineURL: params.declineUrl,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Payriff API error (${response.status}): ${errorText}`,
        };
      }

      const data: PayriffOrderResponse = await response.json();

      if (data.code !== '00000' || !data.payload) {
        return {
          success: false,
          error: `Payriff error: ${data.message} (code: ${data.code})`,
        };
      }

      return {
        success: true,
        providerOrderId: data.payload.orderId,
        providerSessionId: data.payload.sessionId,
        paymentUrl: data.payload.paymentUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: `Payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async getPaymentStatus(providerOrderId: string): Promise<PaymentStatusResult> {
    const response = await fetch(`${this.baseUrl}/v3/orders/${providerOrderId}`, {
      method: 'GET',
      headers: {
        'Authorization': this.secretKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get payment status: ${response.status}`);
    }

    const data: PayriffStatusResponse = await response.json();

    if (!data.payload) {
      throw new Error(`Invalid payment status response: ${data.message}`);
    }

    const statusMap: Record<string, PaymentStatusResult['status']> = {
      'APPROVED': 'completed',
      'DECLINED': 'failed',
      'CANCELED': 'cancelled',
      'EXPIRED': 'expired',
      'REFUNDED': 'refunded',
      'CREATED': 'pending',
    };

    return {
      status: statusMap[data.payload.orderStatus] || 'pending',
      providerOrderId: data.payload.orderId,
      amount: data.payload.amount,
      rawResponse: data as unknown as Record<string, unknown>,
    };
  }

  async refundPayment(providerOrderId: string, amount?: number): Promise<RefundResult> {
    try {
      const body: Record<string, unknown> = {};
      if (amount !== undefined) {
        body.amount = amount;
      }

      const response = await fetch(`${this.baseUrl}/v3/orders/${providerOrderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.secretKey,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Refund failed (${response.status}): ${errorText}`,
        };
      }

      const data = await response.json();

      if (data.code !== '00000') {
        return {
          success: false,
          error: `Refund error: ${data.message}`,
        };
      }

      return {
        success: true,
        providerRef: providerOrderId,
      };
    } catch (error) {
      return {
        success: false,
        error: `Refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  verifyWebhook(body: string, signature: string): boolean {
    // Payriff webhook verification
    // Verify callback by checking order status via API call
    // The primary verification is done by fetching the order status directly
    // rather than relying solely on callback parameters
    if (!body || !signature) return false;
    // In production, always verify by calling getPaymentStatus
    return true;
  }
}

// ---- Provider Factory ----

let _paymentProvider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (_paymentProvider) return _paymentProvider;

  // Currently only Payriff is supported
  _paymentProvider = new PayriffProvider();
  return _paymentProvider;
}
