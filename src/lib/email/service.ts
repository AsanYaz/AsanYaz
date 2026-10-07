/**
 * Email Service — Resend Provider
 * Handles all transactional emails for the platform.
 */

import { Resend } from 'resend';

let _resend: Resend | null = null;

function getResendClient(): Resend {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing required credential: RESEND_API_KEY\n' +
      'Provider: Resend\n' +
      'Purpose: Transactional email delivery\n' +
      'Where to obtain: https://resend.com/api-keys'
    );
  }

  _resend = new Resend(apiKey);
  return _resend;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email via Resend.
 */
export async function sendEmail(params: SendEmailParams): Promise<{ id: string }> {
  const resend = getResendClient();
  const from = process.env.EMAIL_FROM || 'noreply@asanyaz.com';
  const replyTo = process.env.EMAIL_REPLY_TO || 'support@asanyaz.com';

  const { data, error } = await resend.emails.send({
    from: `AsanYaz <${from}>`,
    to: params.to,
    replyTo,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    throw new Error(`Email sending failed: ${error.message}`);
  }

  return { id: data?.id || '' };
}

// ---- Email Templates ----

export function buildPaymentConfirmationEmail(params: {
  name: string;
  orderNumber: string;
  serviceName: string;
  amount: string;
}): { subject: string; html: string } {
  return {
    subject: `Ödəniş təsdiqləndi — ${params.orderNumber}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">AsanYaz</h2>
        <p>Salam, ${params.name}!</p>
        <p>Sifarişiniz üçün ödəniş uğurla qəbul edildi.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Sifariş:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.orderNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Xidmət:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.serviceName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Məbləğ:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.amount} AZN</td></tr>
        </table>
        <p>Sifarişiniz indi emal olunur. Hazır olduqda sizə bildiriş göndəriləcək.</p>
        <p style="color: #666; font-size: 12px;">Bu avtomatik mesajdır. Cavab yazmayın.</p>
      </div>
    `,
  };
}

export function buildOrderCompletedEmail(params: {
  name: string;
  orderNumber: string;
  serviceName: string;
  downloadUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Sifarişiniz hazırdır — ${params.orderNumber}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">AsanYaz</h2>
        <p>Salam, ${params.name}!</p>
        <p>Sifarişiniz hazırdır və yükləməyə hazırdır.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Sifariş:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.orderNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Xidmət:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.serviceName}</td></tr>
        </table>
        <a href="${params.downloadUrl}" style="display: inline-block; background: #1a1a2e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">Sənədi yüklə</a>
        <p style="color: #666; font-size: 12px;">Bu avtomatik mesajdır. Cavab yazmayın.</p>
      </div>
    `,
  };
}

export function buildOrderFailedEmail(params: {
  name: string;
  orderNumber: string;
  serviceName: string;
}): { subject: string; html: string } {
  return {
    subject: `Sifariş xətası — ${params.orderNumber}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">AsanYaz</h2>
        <p>Salam, ${params.name}!</p>
        <p>Sifarişinizin emalı zamanı xəta baş verdi.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Sifariş:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.orderNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Xidmət:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.serviceName}</td></tr>
        </table>
        <p>Komandamız problemi araşdırır. Tezliklə sizinlə əlaqə saxlanılacaq.</p>
        <p style="color: #666; font-size: 12px;">Bu avtomatik mesajdır. Cavab yazmayın.</p>
      </div>
    `,
  };
}

export function buildOrderReceivedEmail(params: {
  name: string;
  orderNumber: string;
  serviceName: string;
}): { subject: string; html: string } {
  return {
    subject: `Sifariş qəbul edildi — ${params.orderNumber}`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a2e;">AsanYaz</h2>
        <p>Salam, ${params.name}!</p>
        <p>Sifarişiniz uğurla qəbul edildi və növbəyə əlavə olundu.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Sifariş:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.orderNumber}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Xidmət:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${params.serviceName}</td></tr>
        </table>
        <p>Ödəniş təsdiqləndiqdən sonra işiniz avtomatik olaraq emal olunacaq.</p>
        <p style="color: #666; font-size: 12px;">Bu avtomatik mesajdır. Cavab yazmayın.</p>
      </div>
    `,
  };
}
