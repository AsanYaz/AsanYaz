import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly configService: ConfigService,
  ) {}

  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    orderId?: string;
  }) {
    const result = await this.pool.query(
      `INSERT INTO notifications (user_id, type, title, message, order_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.userId, data.type, data.title, data.message, data.orderId || null],
    );
    return result.rows[0];
  }

  async getUserNotifications(userId: string, limit = 20) {
    const result = await this.pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  }

  async getUnreadCount(userId: string) {
    const result = await this.pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId],
    );
    return parseInt(result.rows[0].count);
  }

  async markAsRead(id: string, userId: string) {
    await this.pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [id, userId],
    );
  }

  async markAllAsRead(userId: string) {
    await this.pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [userId],
    );
  }

  // Email notification methods
  async sendEmail(to: string, subject: string, html: string) {
    // In production, integrate with Resend/SendGrid/etc.
    console.log(`📧 Email to ${to}: ${subject}`);
    // TODO: Implement email provider integration
  }

  async sendOrderCompletedEmail(userEmail: string, userName: string, orderNumber: string) {
    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #00d4ff, #0099cc); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">AsanYaz</h1>
        </div>
        <div style="padding: 30px; background: #ffffff;">
          <h2>Salam, ${userName}!</h2>
          <p>Sifarişiniz <strong>${orderNumber}</strong> tamamlandı.</p>
          <p>Sənədlərinizi AsanYaz-da yükləyə bilərsiniz.</p>
          <a href="${this.configService.get('APP_URL')}/dashboard" 
             style="display: inline-block; background: #00d4ff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
            Sənədləri yüklə
          </a>
        </div>
        <div style="padding: 20px; background: #f5f5f5; text-align: center; color: #888; font-size: 14px;">
          © AsanYaz - Akademik işlərin daha asan.
        </div>
      </div>
    `;
    await this.sendEmail(userEmail, `Sifarişiniz hazırdır - ${orderNumber}`, html);
  }
}
