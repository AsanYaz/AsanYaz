import { Controller, Get, Param } from '@nestjs/common';
import { UniversitiesService } from './universities.service';

@Controller('universities')
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Get()
  async findAll() {
    const universities = await this.universitiesService.findAll(true);
    return { success: true, data: universities };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const university = await this.universitiesService.findById(id);
    return { success: true, data: university };
  }

  @Get(':id/faculties')
  async getFaculties(@Param('id') id: string) {
    const faculties = await this.universitiesService.getFaculties(id);
    return { success: true, data: faculties };
  }

  @Get('faculties/:facultyId/departments')
  async getDepartments(@Param('facultyId') facultyId: string) {
    const departments = await this.universitiesService.getDepartments(facultyId);
    return { success: true, data: departments };
  }
}
