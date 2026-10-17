import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-students.dto';
import { UpdateStudentDto } from './dto/update-students.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private service: StudentsService) {}

  // the logged-in student's own profile (must stay above ':id')
  @Roles('student')
  @Get('me')
  me(@CurrentUser() user: { id: number }) {
    return this.service.findByUser(user.id);
  }

  @Roles('admin', 'registrar')
  @Get()
  findAll(@Query('program_id') program_id?: string, @Query('status') status?: string) {
    return this.service.findAll({ program_id: program_id ? Number(program_id) : undefined, status });
  }

  @Roles('admin', 'registrar')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Roles('admin', 'registrar')
  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.service.create(dto);
  }

  @Roles('admin', 'registrar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStudentDto) {
    return this.service.update(id, dto);
  }
}
