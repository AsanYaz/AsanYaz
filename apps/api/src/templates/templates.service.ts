import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

@Injectable()
export class TemplatesService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async findAll(universityId?: string, serviceId?: string) {
    let where = 'WHERE t.is_active = TRUE AND t.deleted_at IS NULL';
    const params: any[] = [];
    let idx = 1;

    if (universityId) { where += ` AND t.university_id = $${idx++}`; params.push(universityId); }
    if (serviceId) { where += ` AND (t.service_id = $${idx++} OR t.service_id IS NULL)`; params.push(serviceId); }

    const result = await this.pool.query(
      `SELECT t.*, u.name as university_name, tv.analysis, tv.version
       FROM templates t
       JOIN universities u ON u.id = t.university_id
       LEFT JOIN template_versions tv ON tv.template_id = t.id AND tv.is_active = TRUE
       ${where}
       ORDER BY t.created_at DESC`,
      params,
    );
    return result.rows;
  }

  async findById(id: string) {
    const result = await this.pool.query(
      `SELECT t.*, tv.analysis, tv.version, tv.file_key, tv.file_name
       FROM templates t
       LEFT JOIN template_versions tv ON tv.template_id = t.id AND tv.is_active = TRUE
       WHERE t.id = $1 AND t.deleted_at IS NULL`,
      [id],
    );
    return result.rows[0] || null;
  }

  async getAnalysis(templateId: string) {
    const result = await this.pool.query(
      `SELECT tv.analysis FROM template_versions tv
       WHERE tv.template_id = $1 AND tv.is_active = TRUE`,
      [templateId],
    );
    return result.rows[0]?.analysis || null;
  }

  async create(data: {
    name: string;
    universityId: string;
    facultyId?: string;
    departmentId?: string;
    serviceId?: string;
    language?: string;
  }) {
    const result = await this.pool.query(
      `INSERT INTO templates (name, university_id, faculty_id, department_id, service_id, language)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.name, data.universityId, data.facultyId || null,
       data.departmentId || null, data.serviceId || null, data.language || 'az'],
    );
    return result.rows[0];
  }

  async createVersion(templateId: string, data: {
    fileKey?: string;
    fileName?: string;
    fileType?: string;
    analysis?: any;
  }) {
    // Deactivate current versions
    await this.pool.query(
      'UPDATE template_versions SET is_active = FALSE WHERE template_id = $1',
      [templateId],
    );

    // Get next version number
    const versionResult = await this.pool.query(
      'SELECT COALESCE(MAX(version), 0) + 1 as next FROM template_versions WHERE template_id = $1',
      [templateId],
    );
    const version = versionResult.rows[0].next;

    const result = await this.pool.query(
      `INSERT INTO template_versions (template_id, version, file_key, file_name, file_type, analysis, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING *`,
      [templateId, version, data.fileKey || null, data.fileName || null,
       data.fileType || null, JSON.stringify(data.analysis || {})],
    );
    return result.rows[0];
  }

  async update(id: string, data: Partial<{
    name: string;
    isActive: boolean;
    isVerified: boolean;
    serviceId: string;
    facultyId: string;
    departmentId: string;
  }>) {
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) { updates.push(`name = $${idx++}`); values.push(data.name); }
    if (data.isActive !== undefined) { updates.push(`is_active = $${idx++}`); values.push(data.isActive); }
    if (data.isVerified !== undefined) { updates.push(`is_verified = $${idx++}`); values.push(data.isVerified); }
    if (data.serviceId !== undefined) { updates.push(`service_id = $${idx++}`); values.push(data.serviceId); }
    if (data.facultyId !== undefined) { updates.push(`faculty_id = $${idx++}`); values.push(data.facultyId); }
    if (data.departmentId !== undefined) { updates.push(`department_id = $${idx++}`); values.push(data.departmentId); }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    const result = await this.pool.query(
      `UPDATE templates SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  async getVersions(templateId: string) {
    const result = await this.pool.query(
      'SELECT * FROM template_versions WHERE template_id = $1 ORDER BY version DESC',
      [templateId],
    );
    return result.rows;
  }
}
