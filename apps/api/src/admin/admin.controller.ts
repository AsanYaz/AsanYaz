import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Inject } from '@nestjs/common';
import { AdminGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { ServicesService } from '../services/services.service';
import { UniversitiesService } from '../universities/universities.service';
import { OrdersService } from '../orders/orders.service';
import { TemplatesService } from '../templates/templates.service';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly servicesService: ServicesService,
    private readonly universitiesService: UniversitiesService,
    private readonly ordersService: OrdersService,
    private readonly templatesService: TemplatesService,
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  // ---- Dashboard Stats ----
  @Get('stats')
  async getStats() {
    const [users, orders, revenue, activeOrders] = await Promise.all([
      this.pool.query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL'),
      this.pool.query('SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL'),
      this.pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'"),
      this.pool.query("SELECT COUNT(*) FROM orders WHERE status NOT IN ('completed','cancelled','refunded','failed','draft') AND deleted_at IS NULL"),
    ]);

    return {
      success: true,
      data: {
        totalUsers: parseInt(users.rows[0].count),
        totalOrders: parseInt(orders.rows[0].count),
        totalRevenue: parseFloat(revenue.rows[0].total),
        activeOrders: parseInt(activeOrders.rows[0].count),
      },
    };
  }

  // ---- Users ----
  @Get('users')
  async getUsers(@Query('page') page = 1, @Query('limit') limit = 20, @Query('search') search?: string) {
    const result = await this.usersService.findAll(+page, +limit, search);
    return { success: true, ...result };
  }

  @Patch('users/:id/suspend')
  async suspendUser(@Param('id') id: string) {
    await this.usersService.suspend(id);
    return { success: true, message: 'İstifadəçi dayandırıldı' };
  }

  @Patch('users/:id/restore')
  async restoreUser(@Param('id') id: string) {
    await this.usersService.restore(id);
    return { success: true, message: 'İstifadəçi bərpa edildi' };
  }

  // ---- Services ----
  @Get('services')
  async getServices() {
    const services = await this.servicesService.findAll(false);
    return { success: true, data: services };
  }

  @Post('services')
  async createService(@Body() body: any) {
    const service = await this.servicesService.create(body);
    return { success: true, data: service };
  }

  @Put('services/:id')
  async updateService(@Param('id') id: string, @Body() body: any) {
    const service = await this.servicesService.update(id, body);
    return { success: true, data: service };
  }

  @Delete('services/:id')
  async deleteService(@Param('id') id: string) {
    await this.servicesService.delete(id);
    return { success: true, message: 'Xidmət silindi' };
  }

  // ---- Universities ----
  @Get('universities')
  async getUniversities() {
    const universities = await this.universitiesService.findAll(false);
    return { success: true, data: universities };
  }

  @Post('universities')
  async createUniversity(@Body() body: { name: string; shortName?: string }) {
    const university = await this.universitiesService.create(body);
    return { success: true, data: university };
  }

  @Put('universities/:id')
  async updateUniversity(@Param('id') id: string, @Body() body: any) {
    const university = await this.universitiesService.update(id, body);
    return { success: true, data: university };
  }

  @Post('universities/:id/faculties')
  async createFaculty(@Param('id') universityId: string, @Body('name') name: string) {
    const faculty = await this.universitiesService.createFaculty(universityId, name);
    return { success: true, data: faculty };
  }

  @Post('faculties/:id/departments')
  async createDepartment(@Param('id') facultyId: string, @Body('name') name: string) {
    const department = await this.universitiesService.createDepartment(facultyId, name);
    return { success: true, data: department };
  }

  // ---- Orders ----
  @Get('orders')
  async getOrders(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.ordersService.findAllAdmin(+page, +limit, status, search);
    return { success: true, ...result };
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    const order = await this.ordersService.findById(id);
    return { success: true, data: order };
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    const order = await this.ordersService.updateStatus(id, status);
    return { success: true, data: order };
  }

  @Patch('orders/:id/cancel')
  async cancelOrder(@Param('id') id: string) {
    const order = await this.ordersService.updateStatus(id, 'cancelled');
    return { success: true, data: order };
  }

  // ---- Templates ----
  @Get('templates')
  async getTemplates(@Query('universityId') universityId?: string) {
    const templates = await this.templatesService.findAll(universityId);
    return { success: true, data: templates };
  }

  @Post('templates')
  async createTemplate(@Body() body: any) {
    const template = await this.templatesService.create(body);
    return { success: true, data: template };
  }

  @Put('templates/:id')
  async updateTemplate(@Param('id') id: string, @Body() body: any) {
    const template = await this.templatesService.update(id, body);
    return { success: true, data: template };
  }

  @Post('templates/:id/versions')
  async createTemplateVersion(@Param('id') id: string, @Body() body: any) {
    const version = await this.templatesService.createVersion(id, body);
    return { success: true, data: version };
  }

  @Get('templates/:id/versions')
  async getTemplateVersions(@Param('id') id: string) {
    const versions = await this.templatesService.getVersions(id);
    return { success: true, data: versions };
  }

  // ---- AI ----
  @Get('ai/usage')
  async getAIUsage() {
    const result = await this.pool.query(
      `SELECT provider, model, COUNT(*) as total_jobs,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cost) as total_cost
       FROM ai_jobs
       GROUP BY provider, model
       ORDER BY total_jobs DESC`,
    );
    return { success: true, data: result.rows };
  }

  @Get('ai/failed')
  async getFailedJobs() {
    const result = await this.pool.query(
      `SELECT aj.*, o.order_number, o.topic
       FROM ai_jobs aj
       JOIN orders o ON o.id = aj.order_id
       WHERE aj.status = 'failed'
       ORDER BY aj.created_at DESC
       LIMIT 50`,
    );
    return { success: true, data: result.rows };
  }
}
