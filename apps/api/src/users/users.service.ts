import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    verificationToken?: string;
  }) {
    const result = await this.pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, email_verification_token)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.email, data.passwordHash, data.firstName, data.lastName, data.phone || null, data.verificationToken || null],
    );

    // Create empty profile
    await this.pool.query(
      `INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [result.rows[0].id],
    );

    return result.rows[0];
  }

  async findByEmail(email: string) {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL',
      [email],
    );
    return result.rows[0] || null;
  }

  async findById(id: string) {
    const result = await this.pool.query(
      `SELECT u.*, p.university_id, p.faculty, p.department, p.student_group, p.student_id, p.default_language
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [id],
    );
    return result.rows[0] || null;
  }

  async findByVerificationToken(token: string) {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email_verification_token = $1 AND deleted_at IS NULL',
      [token],
    );
    return result.rows[0] || null;
  }

  async findByResetToken(token: string) {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE password_reset_token = $1 AND deleted_at IS NULL',
      [token],
    );
    return result.rows[0] || null;
  }

  async verifyEmail(id: string) {
    await this.pool.query(
      'UPDATE users SET email_verified = TRUE, email_verification_token = NULL WHERE id = $1',
      [id],
    );
  }

  async setPasswordResetToken(id: string, token: string, expires: Date) {
    await this.pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [token, expires, id],
    );
  }

  async updatePassword(id: string, passwordHash: string) {
    await this.pool.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL WHERE id = $2',
      [passwordHash, id],
    );
  }

  async updateLastLogin(id: string) {
    await this.pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [id],
    );
  }

  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    universityId?: string;
    faculty?: string;
    department?: string;
    studentGroup?: string;
    studentId?: string;
    defaultLanguage?: string;
  }) {
    // Update user table
    if (data.firstName || data.lastName || data.phone !== undefined) {
      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (data.firstName) { updates.push(`first_name = $${idx++}`); values.push(data.firstName); }
      if (data.lastName) { updates.push(`last_name = $${idx++}`); values.push(data.lastName); }
      if (data.phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(data.phone); }

      if (updates.length > 0) {
        values.push(userId);
        await this.pool.query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
          values,
        );
      }
    }

    // Update profile table
    await this.pool.query(
      `INSERT INTO profiles (user_id, university_id, faculty, department, student_group, student_id, default_language)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id)
       DO UPDATE SET
         university_id = COALESCE($2, profiles.university_id),
         faculty = COALESCE($3, profiles.faculty),
         department = COALESCE($4, profiles.department),
         student_group = COALESCE($5, profiles.student_group),
         student_id = COALESCE($6, profiles.student_id),
         default_language = COALESCE($7, profiles.default_language)`,
      [userId, data.universityId || null, data.faculty || null, data.department || null,
       data.studentGroup || null, data.studentId || null, data.defaultLanguage || 'az'],
    );

    return this.findById(userId);
  }

  async findAll(page = 1, limit = 20, search?: string) {
    let whereClause = 'WHERE u.deleted_at IS NULL';
    const params: any[] = [];
    let idx = 1;

    if (search) {
      whereClause += ` AND (u.email ILIKE $${idx} OR u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM users u ${whereClause}`,
      params,
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, (page - 1) * limit);
    const result = await this.pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.email_verified, u.is_active, u.created_at, u.last_login_at
       FROM users u ${whereClause}
       ORDER BY u.created_at DESC
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

  async suspend(id: string) {
    await this.pool.query('UPDATE users SET is_active = FALSE WHERE id = $1', [id]);
  }

  async restore(id: string) {
    await this.pool.query('UPDATE users SET is_active = TRUE WHERE id = $1', [id]);
  }

  async deleteAccount(id: string) {
    await this.pool.query('UPDATE users SET deleted_at = NOW(), is_active = FALSE WHERE id = $1', [id]);
  }
}
