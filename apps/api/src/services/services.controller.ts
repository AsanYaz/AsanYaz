import { Controller, Get, Param } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async findAll() {
    const services = await this.servicesService.findAll(true);
    return { success: true, data: services };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const service = await this.servicesService.findById(id);
    return { success: true, data: service };
  }
}
