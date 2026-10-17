import { Controller, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'registrar')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('overview')
  overview() {
    return this.service.overview();
  }

  // semester_id is optional: the current semester is used when it is missing
  @Get('enrollment')
  enrollment(@Query('semester_id', new ParseIntPipe({ optional: true })) semesterId?: number) {
    return this.service.enrollment(semesterId);
  }

  @Get('students-by-program')
  studentsByProgram() {
    return this.service.studentsByProgram();
  }

  @Get('grades')
  grades(@Query('semester_id', new ParseIntPipe({ optional: true })) semesterId?: number) {
    return this.service.grades(semesterId);
  }

  @Get('payments')
  payments(@Query('semester_id', new ParseIntPipe({ optional: true })) semesterId?: number) {
    return this.service.payments(semesterId);
  }
}
