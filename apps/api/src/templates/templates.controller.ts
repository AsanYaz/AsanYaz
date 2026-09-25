import { Controller, Get, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async findAll(
    @Query('universityId') universityId?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    const templates = await this.templatesService.findAll(universityId, serviceId);
    return { success: true, data: templates };
  }
}
