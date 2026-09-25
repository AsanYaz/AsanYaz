import { Controller, Get, Put, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { IsOptional, IsString } from 'class-validator';

class UpdateProfileDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() universityId?: string;
  @IsOptional() @IsString() faculty?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() studentGroup?: string;
  @IsOptional() @IsString() studentId?: string;
  @IsOptional() @IsString() defaultLanguage?: string;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    const { password_hash, email_verification_token, password_reset_token, password_reset_expires, ...safe } = user;
    return { success: true, data: safe };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.sub, dto);
    const { password_hash, email_verification_token, password_reset_token, password_reset_expires, ...safe } = user;
    return { success: true, data: safe };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  async deleteAccount(@Request() req: any) {
    await this.usersService.deleteAccount(req.user.sub);
    return { success: true, message: 'Hesab silindi' };
  }
}
