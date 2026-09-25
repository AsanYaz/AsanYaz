import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

@Injectable()
export class UniversitiesService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findAll(activeOnly = true) {
    const where = activeOnly ? 'WHERE is_active = TRUE AND deleted_at IS NULL' : 'WHERE deleted_at IS NULL';
    const result = await this.pool.query(`SELECT * FROM universities ${where} ORDER BY name ASC`);
    return result.rows;
  }

  async findById(id: string) {
    const result = await this.pool.query('SELECT * FROM universities WHERE id = $1 AND deleted_at IS NULL', [id]);
    return result.rows[0] || null;
  }

  async getFaculties(universityId: string) {
    const result = await this.pool.query(
      'SELECT * FROM faculties WHERE university_id = $1 AND is_active = TRUE AND deleted_at IS NULL ORDER BY name ASC',
      [universityId],
    );
    return result.rows;
  }

  async getDepartments(facultyId: string) {
    const result = await this.pool.query(
      'SELECT * FROM departments WHERE faculty_id = $1 AND is_active = TRUE AND deleted_at IS NULL ORDER BY name ASC',
      [facultyId],
    );
    return result.rows;
  }

  async create(data: { name: string; shortName?: string }) {
    const result = await this.pool.query(
      'INSERT INTO universities (name, short_name) VALUES ($1, $2) RETURNING *',
      [data.name, data.shortName || null],
    );
    return result.rows[0];
  }

  async update(id: string, data: { name?: string; shortName?: string; isActive?: boolean }) {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) { updates.push(`name = $${idx++}`); values.push(data.name); }
    if (data.shortName !== undefined) { updates.push(`short_name = $${idx++}`); values.push(data.shortName); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${idx++}`); values.push(data.isActive); }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const result = await this.pool.query(
      `UPDATE universities SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  async createFaculty(universityId: string, name: string) {
    const result = await this.pool.query(
      'INSERT INTO faculties (university_id, name) VALUES ($1, $2) RETURNING *',
      [universityId, name],
    );
    return result.rows[0];
  }

  async createDepartment(facultyId: string, name: string) {
    const result = await this.pool.query(
      'INSERT INTO departments (faculty_id, name) VALUES ($1, $2) RETURNING *',
      [facultyId, name],
    );
    return result.rows[0];
  }
}
