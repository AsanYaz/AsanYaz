import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Request, Headers } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createPayment(@Request() req: any, @Body('orderId') orderId: string) {
    const result = await this.paymentsService.createPayment(orderId, req.user.sub);
    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('confirm/:paymentId')
  async confirmPayment(@Param('paymentId') paymentId: string) {
    const result = await this.paymentsService.confirmPayment(paymentId);
    return { success: true, data: result };
  }

  @Post('webhook')
  async handleWebhook(
    @Body() body: any,
    @Headers('x-payment-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(body, signature);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.paymentsService.getPaymentHistory(req.user.sub, +page, +limit);
    return { success: true, ...result };
  }

  @UseGuards(JwtAuthGuard)
  @Get('methods')
  async getPaymentMethods(@Request() req: any) {
    const methods = await this.paymentsService.getPaymentMethods(req.user.sub);
    return { success: true, data: methods };
  }

  @UseGuards(JwtAuthGuard)
  @Post('methods')
  async addPaymentMethod(@Request() req: any, @Body() body: any) {
    const method = await this.paymentsService.addPaymentMethod(req.user.sub, body);
    return { success: true, data: method };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('methods/:id')
  async removePaymentMethod(@Request() req: any, @Param('id') id: string) {
    await this.paymentsService.removePaymentMethod(req.user.sub, id);
    return { success: true, message: 'Ödəniş üsulu silindi' };
  }
}
