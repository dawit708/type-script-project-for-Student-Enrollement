import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { TakeAttendanceDto } from './dto/create-attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private service: AttendanceService) {}

  @Roles('teacher', 'admin')
  @Post()
  take(@Body() dto: TakeAttendanceDto, @CurrentUser() user: { id: number; role: string }) {
    return this.service.take(dto, user);
  }

  // student: my attendance (add ?section_id=1 to also get the day-by-day list)
  @Roles('student')
  @Get('mine')
  mine(@CurrentUser() user: { id: number }, @Query('section_id') section_id?: string) {
    return this.service.mine(user.id, section_id ? Number(section_id) : undefined);
  }

  @Roles('teacher', 'admin', 'registrar')
  @Get('section/:sectionId/summary')
  summary(@Param('sectionId', ParseIntPipe) sectionId: number, @CurrentUser() user: { id: number; role: string }) {
    return this.service.sectionSummary(sectionId, user);
  }

  @Roles('teacher', 'admin', 'registrar')
  @Get('section/:sectionId')
  sheet(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Query('date') date: string | undefined,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.service.sheet(sectionId, date, user);
  }
}
