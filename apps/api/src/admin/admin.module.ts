import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';
import { ServicesModule } from '../services/services.module';
import { UniversitiesModule } from '../universities/universities.module';
import { OrdersModule } from '../orders/orders.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [UsersModule, ServicesModule, UniversitiesModule, OrdersModule, TemplatesModule],
  controllers: [AdminController],
})
export class AdminModule {}
