import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teachers.dto';
import { UpdateTeacherDto } from './dto/update-teachers.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('teachers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeachersController {
  constructor(private service: TeachersService) {}

  // the logged-in teacher's own profile (must stay above ':id')
  @Roles('teacher')
  @Get('me')
  me(@CurrentUser() user: { id: number }) {
    return this.service.findByUser(user.id);
  }

  @Roles('admin', 'registrar')
  @Get()
  findAll(@Query('department_id') department_id?: string) {
    return this.service.findAll(department_id ? Number(department_id) : undefined);
  }

  @Roles('admin', 'registrar')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Roles('admin')
  @Post()
  create(@Body() dto: CreateTeacherDto) {
    return this.service.create(dto);
  }

  @Roles('admin')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTeacherDto) {
    return this.service.update(id, dto);
  }
}
