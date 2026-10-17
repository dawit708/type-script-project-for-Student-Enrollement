import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { RequestEnrollmentDto } from './dto/create-enrollments.dto';
import { RejectEnrollmentDto } from './dto/update-enrollments.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private service: EnrollmentsService) {}

  // ----- student -----
  @Roles('student')
  @Post()
  request(@CurrentUser() user: { id: number }, @Body() dto: RequestEnrollmentDto) {
    return this.service.request(user.id, dto.section_id);
  }

  @Roles('student')
  @Get('mine')
  mine(@CurrentUser() user: { id: number }, @Query('status') status?: string) {
    return this.service.mine(user.id, status);
  }

  @Roles('student')
  @Get('schedule')
  schedule(@CurrentUser() user: { id: number }) {
    return this.service.schedule(user.id);
  }

  @Roles('student')
  @Delete(':id')
  drop(@CurrentUser() user: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.service.drop(user.id, id);
  }

  // ----- registrar / admin -----
  @Roles('admin', 'registrar')
  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('section_id') section_id?: string,
    @Query('semester_id') semester_id?: string,
    @Query('student_id') student_id?: string,
  ) {
    return this.service.findAll({
      status,
      section_id: section_id ? Number(section_id) : undefined,
      semester_id: semester_id ? Number(semester_id) : undefined,
      student_id: student_id ? Number(student_id) : undefined,
    });
  }

  @Roles('admin', 'registrar')
  @Patch(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.service.approve(id, user.id);
  }

  @Roles('admin', 'registrar')
  @Patch(':id/reject')
  reject(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }, @Body() dto: RejectEnrollmentDto) {
    return this.service.reject(id, user.id, dto.reason);
  }
}
