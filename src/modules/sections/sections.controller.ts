import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { CreateSectionDto } from './dto/create-sections.dto';
import { UpdateSectionDto } from './dto/update-sections.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('sections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SectionsController {
  constructor(private service: SectionsService) {}

  @Get()
  findAll(
    @Query('semester_id') semester_id?: string,
    @Query('course_id') course_id?: string,
    @Query('teacher_id') teacher_id?: string,
  ) {
    return this.service.findAll({
      semester_id: semester_id ? Number(semester_id) : undefined,
      course_id: course_id ? Number(course_id) : undefined,
      teacher_id: teacher_id ? Number(teacher_id) : undefined,
    });
  }

  // teacher: my sections (keep above ':id')
  @Roles('teacher')
  @Get('mine')
  mine(@CurrentUser() user: { id: number }) {
    return this.service.findMine(user.id);
  }

  @Roles('admin', 'registrar', 'teacher')
  @Get(':id/students')
  classList(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number; role: string }) {
    return this.service.classList(id, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Roles('admin', 'registrar')
  @Post()
  create(@Body() dto: CreateSectionDto) {
    return this.service.create(dto);
  }

  @Roles('admin', 'registrar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSectionDto) {
    return this.service.update(id, dto);
  }

  @Roles('admin', 'registrar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
