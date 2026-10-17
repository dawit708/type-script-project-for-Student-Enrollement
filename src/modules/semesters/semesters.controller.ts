import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { SemestersService } from './semesters.service';
import { CreateSemesterDto } from './dto/create-semesters.dto';
import { ToggleEnrollmentDto, UpdateSemesterDto } from './dto/update-semesters.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('semesters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SemestersController {
  constructor(private service: SemestersService) {}

  @Get() findAll() { return this.service.findAll(); }

  @Get('current') findCurrent() { return this.service.findCurrent(); }

  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Roles('admin') @Post() create(@Body() dto: CreateSemesterDto) { return this.service.create(dto); }

  @Roles('admin') @Patch(':id/enrollment')
  toggle(@Param('id', ParseIntPipe) id: number, @Body() dto: ToggleEnrollmentDto) {
    return this.service.setEnrollment(id, dto.is_enrollment_open);
  }

  @Roles('admin') @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSemesterDto) { return this.service.update(id, dto); }

  @Roles('admin') @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
