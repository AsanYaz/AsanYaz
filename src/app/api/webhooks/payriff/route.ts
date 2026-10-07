import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getPaymentProvider } from '@/lib/payment/provider';

// This handles the webhook/callback from Payriff
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-payriff-signature') || ''; // Example header
    
    const paymentProvider = getPaymentProvider();
    
    // Attempt to verify signature
    if (!paymentProvider.verifyWebhook(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    
    // Payriff typically sends orderId in the payload
    const providerOrderId = payload.payload?.orderId || payload.orderId;
    
    if (!providerOrderId) {
      return NextResponse.json({ error: 'Missing orderId in payload' }, { status: 400 });
    }

    // Always fetch status directly from provider rather than trusting payload
    const statusResult = await paymentProvider.getPaymentStatus(providerOrderId);

    // Find the payment record
    const payment = await prisma.payment.findFirst({
      where: { providerOrderId },
      include: { order: true }
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: statusResult.status,
        updatedAt: new Date(),
        ...(statusResult.status === 'completed' ? { paidAt: new Date() } : {}),
        ...(statusResult.status === 'failed' ? { failedAt: new Date() } : {})
      }
    });

    // Record the transaction
    await prisma.paymentTransaction.create({
      data: {
        paymentId: payment.id,
        type: 'charge_update',
        amountAzn: statusResult.amount || payment.amountAzn,
        status: statusResult.status,
        rawResponse: statusResult.rawResponse as any
      }
    });

    // Update order status if payment completed
    if (statusResult.status === 'completed' && payment.order.status === 'awaiting_payment') {
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'paid' }
      });
      
      // Enqueue order for processing
      const { enqueueOrderProcessing } = await import('@/lib/queue');
      await enqueueOrderProcessing({
        orderId: payment.orderId,
        userId: payment.userId,
        serviceId: payment.order.serviceId,
        attempt: 1
      });
      
      // Send confirmation email
      const { enqueueEmail } = await import('@/lib/queue');
      const { buildPaymentConfirmationEmail } = await import('@/lib/email/service');
      
      const user = await prisma.user.findUnique({ 
        where: { id: payment.userId },
        include: { profile: true }
      });
      
      const service = await prisma.service.findUnique({
        where: { id: payment.order.serviceId }
      });
      
      if (user && service) {
        const emailData = buildPaymentConfirmationEmail({
          name: user.profile?.firstName || 'Müştəri',
          orderNumber: payment.order.orderNumber,
          serviceName: service.name,
          amount: payment.amountAzn.toString()
        });
        
        await enqueueEmail({
          to: user.email,
          subject: emailData.subject,
          html: emailData.html
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
