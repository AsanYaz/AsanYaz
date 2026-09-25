import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    // Check if user already exists
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Bu email artıq istifadə olunur');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);
    const verificationToken = uuidv4();

    // Create user
    const user = await this.usersService.create({
      email: data.email.toLowerCase().trim(),
      passwordHash,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone?.trim(),
      verificationToken,
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email.toLowerCase().trim());
    if (!user) {
      throw new UnauthorizedException('Email və ya şifrə yanlışdır');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Hesabınız dayandırılıb');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedException('Email və ya şifrə yanlışdır');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Yanlış təsdiq linki');
    }

    await this.usersService.verifyEmail(user.id);
    return { message: 'Email təsdiqləndi' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findByEmail(email.toLowerCase().trim());
    if (!user) {
      // Don't reveal if email exists
      return { message: 'Əgər hesab mövcuddursa, şifrə sıfırlama linki göndərildi' };
    }

    const resetToken = uuidv4();
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.setPasswordResetToken(user.id, resetToken, expires);

    // TODO: Send email with reset link

    return { message: 'Əgər hesab mövcuddursa, şifrə sıfırlama linki göndərildi' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user || !user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) {
      throw new BadRequestException('Yanlış və ya vaxtı keçmiş sıfırlama linki');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(user.id, passwordHash);

    return { message: 'Şifrə uğurla dəyişdirildi' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('İstifadəçi tapılmadı');
    }
    return this.sanitizeUser(user);
  }

  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    const { password_hash, email_verification_token, password_reset_token, password_reset_expires, ...safe } = user;
    return safe;
  }
}
