import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';

// Payment provider abstraction
interface PaymentProvider {
  createPayment(amount: number, currency: string, metadata: Record<string, string>): Promise<{
    id: string;
    checkoutUrl?: string;
    status: string;
  }>;
  verifyPayment(paymentId: string): Promise<{
    verified: boolean;
    status: string;
  }>;
  refund(paymentId: string, amount?: number): Promise<{ success: boolean }>;
}

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {}

  async createPayment(orderId: string, userId: string) {
    const order = await this.ordersService.findById(orderId);
    if (!order) throw new BadRequestException('Sifariş tapılmadı');
    if (order.user_id !== userId) throw new BadRequestException('Bu sifariş sizə aid deyil');
    if (order.status !== 'awaiting_payment') throw new BadRequestException('Bu sifariş ödəniş gözləmir');

    // Create payment record
    const result = await this.pool.query(
      `INSERT INTO payments (order_id, user_id, amount, currency, status, provider)
       VALUES ($1, $2, $3, 'AZN', 'pending', $4)
       RETURNING *`,
      [orderId, userId, order.price, this.configService.get('PAYMENT_PROVIDER', 'stripe')],
    );

    const payment = result.rows[0];

    // In production, call payment provider to create checkout session
    // For MVP, simulate payment processing
    return {
      paymentId: payment.id,
      amount: order.price,
      currency: 'AZN',
      // checkoutUrl would come from the payment provider
      checkoutUrl: `${this.configService.get('APP_URL')}/payment/checkout/${payment.id}`,
    };
  }

  async confirmPayment(paymentId: string) {
    const paymentResult = await this.pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [paymentId],
    );
    const payment = paymentResult.rows[0];
    if (!payment) throw new BadRequestException('Ödəniş tapılmadı');

    // Update payment status
    await this.pool.query(
      "UPDATE payments SET status = 'completed' WHERE id = $1",
      [paymentId],
    );

    // Update order status to paid
    await this.ordersService.updateStatus(payment.order_id, 'paid');

    // In production, this would trigger the job queue
    // For now, move directly to queued
    await this.ordersService.updateStatus(payment.order_id, 'queued');

    return { success: true, orderId: payment.order_id };
  }

  async handleWebhook(body: any, signature: string) {
    // Verify webhook signature
    const secret = this.configService.get('PAYMENT_WEBHOOK_SECRET');
    // TODO: Implement provider-specific signature verification

    // Idempotency check
    const existingPayment = await this.pool.query(
      'SELECT * FROM payments WHERE provider_payment_id = $1',
      [body.paymentId],
    );
    if (existingPayment.rows[0]?.status === 'completed') {
      return { success: true, message: 'Already processed' };
    }

    // Process the webhook
    if (body.status === 'succeeded') {
      return this.confirmPayment(body.paymentId);
    }

    return { success: true };
  }

  async getPaymentHistory(userId: string, page = 1, limit = 20) {
    const countResult = await this.pool.query(
      'SELECT COUNT(*) FROM payments WHERE user_id = $1',
      [userId],
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await this.pool.query(
      `SELECT p.*, o.order_number, o.topic, s.name as service_name
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       JOIN services s ON s.id = o.service_id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, (page - 1) * limit],
    );

    return {
      data: result.rows,
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async addPaymentMethod(userId: string, data: {
    provider: string;
    providerMethodId: string;
    cardLastFour?: string;
    cardBrand?: string;
  }) {
    const result = await this.pool.query(
      `INSERT INTO payment_methods (user_id, provider, provider_method_id, card_last_four, card_brand, is_default)
       VALUES ($1, $2, $3, $4, $5, TRUE)
       RETURNING id, provider, card_last_four, card_brand, is_default, created_at`,
      [userId, data.provider, data.providerMethodId, data.cardLastFour || null, data.cardBrand || null],
    );
    return result.rows[0];
  }

  async getPaymentMethods(userId: string) {
    const result = await this.pool.query(
      `SELECT id, provider, card_last_four, card_brand, is_default, created_at
       FROM payment_methods WHERE user_id = $1 AND deleted_at IS NULL
       ORDER BY is_default DESC, created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async removePaymentMethod(userId: string, methodId: string) {
    await this.pool.query(
      'UPDATE payment_methods SET deleted_at = NOW() WHERE id = $1 AND user_id = $2',
      [methodId, userId],
    );
  }
}
