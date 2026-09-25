import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

class CreateOrderDto {
  @IsUUID() serviceId: string;
  @IsUUID() universityId: string;
  @IsOptional() @IsUUID() facultyId?: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsString() topic: string;
  @IsOptional() @IsNumber() requestedLength?: number;
  @IsString() studentName: string;
  @IsOptional() @IsString() instructorName?: string;
  @IsOptional() @IsString() additionalRequirements?: string;
  @IsOptional() @IsString() language?: string;
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() dto: CreateOrderDto) {
    const order = await this.ordersService.create(req.user.sub, dto);
    return { success: true, data: order };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findMyOrders(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.ordersService.findByUserId(req.user.sub, status, +page, +limit);
    return { success: true, ...result };
  }

  @UseGuards(JwtAuthGuard)
  @Get('active')
  async getActiveOrders(@Request() req: any) {
    const orders = await this.ordersService.getActiveOrders(req.user.sub);
    return { success: true, data: orders };
  }

  @UseGuards(JwtAuthGuard)
  @Get('archive')
  async getArchive(
    @Request() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.ordersService.getArchive(req.user.sub, +page, +limit);
    return { success: true, ...result };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    const order = await this.ordersService.findById(id);
    if (!order) return { success: false, error: 'Sifariş tapılmadı' };
    if (order.user_id !== req.user.sub && req.user.role === 'user') {
      throw new ForbiddenException('Bu sifarişə baxmaq hüququnuz yoxdur');
    }
    return { success: true, data: order };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/files')
  async getFiles(@Request() req: any, @Param('id') id: string) {
    const order = await this.ordersService.findById(id);
    if (!order) return { success: false, error: 'Sifariş tapılmadı' };
    if (order.user_id !== req.user.sub && req.user.role === 'user') {
      throw new ForbiddenException('Bu sifarişə baxmaq hüququnuz yoxdur');
    }
    const files = await this.ordersService.getOrderFiles(id);
    return { success: true, data: files };
  }
}
