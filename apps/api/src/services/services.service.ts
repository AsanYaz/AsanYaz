import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

@Injectable()
export class ServicesService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findAll(activeOnly = true) {
    const where = activeOnly ? 'WHERE is_active = TRUE AND deleted_at IS NULL' : 'WHERE deleted_at IS NULL';
    const result = await this.pool.query(
      `SELECT * FROM services ${where} ORDER BY sort_order ASC`,
    );
    return result.rows;
  }

  async findById(id: string) {
    const result = await this.pool.query(
      'SELECT * FROM services WHERE id = $1 AND deleted_at IS NULL',
      [id],
    );
    return result.rows[0] || null;
  }

  async create(data: {
    name: string;
    description: string;
    price: number;
    requiredFields?: any[];
    supportedOutputFormats?: string[];
    estimatedProcessingMinutes?: number;
    sortOrder?: number;
  }) {
    const result = await this.pool.query(
      `INSERT INTO services (name, description, price, required_fields, supported_output_formats, estimated_processing_minutes, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.name, data.description, data.price,
        JSON.stringify(data.requiredFields || []),
        JSON.stringify(data.supportedOutputFormats || ['pdf', 'docx']),
        data.estimatedProcessingMinutes || 15,
        data.sortOrder || 0,
      ],
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<{
    name: string;
    description: string;
    price: number;
    isActive: boolean;
    requiredFields: any[];
    supportedOutputFormats: string[];
    estimatedProcessingMinutes: number;
    sortOrder: number;
  }>) {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) { updates.push(`name = $${idx++}`); values.push(data.name); }
    if (data.description !== undefined) { updates.push(`description = $${idx++}`); values.push(data.description); }
    if (data.price !== undefined) { updates.push(`price = $${idx++}`); values.push(data.price); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${idx++}`); values.push(data.isActive); }
    if (data.requiredFields !== undefined) { updates.push(`required_fields = $${idx++}`); values.push(JSON.stringify(data.requiredFields)); }
    if (data.supportedOutputFormats !== undefined) { updates.push(`supported_output_formats = $${idx++}`); values.push(JSON.stringify(data.supportedOutputFormats)); }
    if (data.estimatedProcessingMinutes !== undefined) { updates.push(`estimated_processing_minutes = $${idx++}`); values.push(data.estimatedProcessingMinutes); }
    if (data.sortOrder !== undefined) { updates.push(`sort_order = $${idx++}`); values.push(data.sortOrder); }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const result = await this.pool.query(
      `UPDATE services SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  async delete(id: string) {
    await this.pool.query('UPDATE services SET deleted_at = NOW() WHERE id = $1', [id]);
  }
}
