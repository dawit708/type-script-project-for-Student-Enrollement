import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-courses.dto';
import { UpdateCourseDto } from './dto/update-courses.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const toInt = (v?: string) => {
  const n = Number(v);
  return v !== undefined && v !== '' && Number.isInteger(n) ? n : undefined;
};

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private service: CoursesService) {}

  // GET /courses?year_level=2&semester_no=1&course_type=optional
  @Get()
  findAll(
    @Query('year_level') year_level?: string,
    @Query('semester_no') semester_no?: string,
    @Query('course_type') course_type?: string,
    @Query('department_id') department_id?: string,
  ) {
    return this.service.list({
      year_level: toInt(year_level),
      semester_no: toInt(semester_no),
      course_type: course_type === 'core' || course_type === 'optional' ? course_type : undefined,
      department_id: toInt(department_id),
    });
  }

  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Roles('admin') @Post() create(@Body() dto: CreateCourseDto) { return this.service.create(dto); }

  @Roles('admin') @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourseDto) { return this.service.update(id, dto); }

  @Roles('admin') @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
