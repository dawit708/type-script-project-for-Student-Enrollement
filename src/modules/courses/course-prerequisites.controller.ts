import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { IsInt } from 'class-validator';
import { CoursePrerequisitesService } from './course-prerequisites.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

class AddPrerequisiteDto {
  @IsInt() prerequisite_id: number;
}

@Controller('courses/:courseId/prerequisites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursePrerequisitesController {
  constructor(private service: CoursePrerequisitesService) {}

  @Get()
  list(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.service.list(courseId);
  }

  @Roles('admin')
  @Post()
  add(@Param('courseId', ParseIntPipe) courseId: number, @Body() dto: AddPrerequisiteDto) {
    return this.service.add(courseId, dto.prerequisite_id);
  }

  @Roles('admin')
  @Delete(':prerequisiteId')
  remove(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('prerequisiteId', ParseIntPipe) prerequisiteId: number,
  ) {
    return this.service.remove(courseId, prerequisiteId);
  }
}
