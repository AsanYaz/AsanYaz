import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';
import { ServicesService } from '../services/services.service';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    private readonly servicesService: ServicesService,
  ) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `AY-${timestamp}-${random}`;
  }

  async create(userId: string, data: {
    serviceId: string;
    universityId: string;
    facultyId?: string;
    departmentId?: string;
    topic: string;
    requestedLength?: number;
    studentName: string;
    instructorName?: string;
    additionalRequirements?: string;
    language?: string;
  }) {
    const service = await this.servicesService.findById(data.serviceId);
    if (!service) throw new NotFoundException('Xidmət tapılmadı');
    if (!service.is_active) throw new BadRequestException('Bu xidmət hal-hazırda mövcud deyil');

    // Find matching template
    const templateResult = await this.pool.query(
      `SELECT t.id FROM templates t
       INNER JOIN template_versions tv ON tv.template_id = t.id AND tv.is_active = TRUE
       WHERE t.university_id = $1 AND t.is_active = TRUE AND t.deleted_at IS NULL
       ORDER BY
         CASE WHEN t.service_id = $2 THEN 0 ELSE 1 END,
         CASE WHEN t.faculty_id = $3 THEN 0 ELSE 1 END,
         t.created_at DESC
       LIMIT 1`,
      [data.universityId, data.serviceId, data.facultyId || null],
    );

    const templateId = templateResult.rows[0]?.id || null;
    const orderNumber = this.generateOrderNumber();

    const result = await this.pool.query(
      `INSERT INTO orders (order_number, user_id, service_id, university_id, faculty_id, department_id, template_id,
        topic, requested_length, student_name, instructor_name, additional_requirements, language, status, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'awaiting_payment', $14)
       RETURNING *`,
      [
        orderNumber, userId, data.serviceId, data.universityId,
        data.facultyId || null, data.departmentId || null, templateId,
        data.topic, data.requestedLength || null, data.studentName,
        data.instructorName || null, data.additionalRequirements || null,
        data.language || 'az', service.price,
      ],
    );

    return result.rows[0];
  }

  async findById(id: string) {
    const result = await this.pool.query(
      `SELECT o.*, s.name as service_name, u.name as university_name,
        COALESCE(f.name, '') as faculty_name, COALESCE(d.name, '') as department_name
       FROM orders o
       JOIN services s ON s.id = o.service_id
       JOIN universities u ON u.id = o.university_id
       LEFT JOIN faculties f ON f.id = o.faculty_id
       LEFT JOIN departments d ON d.id = o.department_id
       WHERE o.id = $1 AND o.deleted_at IS NULL`,
      [id],
    );
    return result.rows[0] || null;
  }

  async findByOrderNumber(orderNumber: string) {
    const result = await this.pool.query(
      `SELECT o.*, s.name as service_name, u.name as university_name
       FROM orders o
       JOIN services s ON s.id = o.service_id
       JOIN universities u ON u.id = o.university_id
       WHERE o.order_number = $1 AND o.deleted_at IS NULL`,
      [orderNumber],
    );
    return result.rows[0] || null;
  }

  async findByUserId(userId: string, status?: string, page = 1, limit = 20) {
    let whereClause = 'WHERE o.user_id = $1 AND o.deleted_at IS NULL';
    const params: any[] = [userId];
    let idx = 2;

    if (status) {
      whereClause += ` AND o.status = $${idx++}`;
      params.push(status);
    }

    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM orders o ${whereClause}`, params,
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, (page - 1) * limit);
    const result = await this.pool.query(
      `SELECT o.*, s.name as service_name, u.name as university_name
       FROM orders o
       JOIN services s ON s.id = o.service_id
       JOIN universities u ON u.id = o.university_id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params,
    );

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(id: string, status: string) {
    const updates: any = { status };
    if (status === 'completed') {
      const result = await this.pool.query(
        `UPDATE orders SET status = $1, completed_at = NOW() WHERE id = $2 RETURNING *`,
        [status, id],
      );
      return result.rows[0];
    }

    const result = await this.pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id],
    );
    return result.rows[0];
  }

  async getOrderFiles(orderId: string) {
    const result = await this.pool.query(
      'SELECT * FROM order_files WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId],
    );
    return result.rows;
  }

  async addOrderFile(orderId: string, data: {
    fileKey: string;
    fileName: string;
    fileType: string;
    mimeType: string;
    fileSize: number;
    checksum?: string;
    version?: number;
  }) {
    const result = await this.pool.query(
      `INSERT INTO order_files (order_id, file_key, file_name, file_type, mime_type, file_size, checksum, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [orderId, data.fileKey, data.fileName, data.fileType, data.mimeType,
       data.fileSize, data.checksum || null, data.version || 1],
    );
    return result.rows[0];
  }

  async getActiveOrders(userId: string) {
    const result = await this.pool.query(
      `SELECT o.*, s.name as service_name, u.name as university_name
       FROM orders o
       JOIN services s ON s.id = o.service_id
       JOIN universities u ON u.id = o.university_id
       WHERE o.user_id = $1 AND o.status NOT IN ('completed', 'cancelled', 'refunded', 'failed')
       AND o.deleted_at IS NULL
       ORDER BY o.created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  async getArchive(userId: string, page = 1, limit = 20) {
    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM orders WHERE user_id = $1 AND status = 'completed' AND deleted_at IS NULL`,
      [userId],
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await this.pool.query(
      `SELECT o.*, s.name as service_name, u.name as university_name
       FROM orders o
       JOIN services s ON s.id = o.service_id
       JOIN universities u ON u.id = o.university_id
       WHERE o.user_id = $1 AND o.status = 'completed' AND o.deleted_at IS NULL
       ORDER BY o.completed_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, (page - 1) * limit],
    );

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllAdmin(page = 1, limit = 20, status?: string, search?: string) {
    let whereClause = 'WHERE o.deleted_at IS NULL';
    const params: any[] = [];
    let idx = 1;

    if (status) {
      whereClause += ` AND o.status = $${idx++}`;
      params.push(status);
    }
    if (search) {
      whereClause += ` AND (o.order_number ILIKE $${idx} OR o.topic ILIKE $${idx} OR o.student_name ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const countResult = await this.pool.query(`SELECT COUNT(*) FROM orders o ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, (page - 1) * limit);
    const result = await this.pool.query(
      `SELECT o.*, s.name as service_name, u.name as university_name,
        usr.email as user_email, usr.first_name as user_first_name, usr.last_name as user_last_name
       FROM orders o
       JOIN services s ON s.id = o.service_id
       JOIN universities u ON u.id = o.university_id
       JOIN users usr ON usr.id = o.user_id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params,
    );

    return {
      data: result.rows,
      total, page, limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
