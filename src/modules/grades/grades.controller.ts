import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { GradesService } from './grades.service';
import { SaveGradeDto } from './dto/create-grades.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GradesController {
  constructor(private service: GradesService) {}

  // teacher enters or updates marks (creates the row on first save)
  @Roles('teacher', 'admin')
  @Post()
  save(@Body() dto: SaveGradeDto, @CurrentUser() user: { id: number; role: string }) {
    return this.service.save(dto, user);
  }

  @Roles('teacher', 'admin', 'registrar')
  @Get('section/:sectionId')
  bySection(@Param('sectionId', ParseIntPipe) sectionId: number, @CurrentUser() user: { id: number; role: string }) {
    return this.service.findBySection(sectionId, user);
  }

  // student: my grades, GPA and transcript
  @Roles('student')
  @Get('mine')
  mine(@CurrentUser() user: { id: number }) {
    return this.service.mine(user.id);
  }

  // registrar / admin: official transcript of any student
  @Roles('admin', 'registrar')
  @Get('transcript/:studentId')
  transcript(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.service.transcript(studentId);
  }
}
