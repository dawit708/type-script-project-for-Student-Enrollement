import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, UpdatePaymentStatusDto } from './dto/create-payments.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private service: PaymentsService) {}

  @Roles('student')
  @Get('mine')
  mine(@CurrentUser() user: { id: number }) {
    return this.service.mine(user.id);
  }

  @Roles('admin', 'registrar')
  @Get('student/:studentId')
  studentSummary(@Param('studentId', ParseIntPipe) studentId: number) {
    return this.service.summary(studentId);
  }

  @Roles('admin', 'registrar')
  @Get()
  findAll(
    @Query('student_id') student_id?: string,
    @Query('semester_id') semester_id?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({
      student_id: student_id ? Number(student_id) : undefined,
      semester_id: semester_id ? Number(semester_id) : undefined,
      status,
    });
  }

  @Roles('admin', 'registrar')
  @Post()
  create(@Body() dto: CreatePaymentDto, @CurrentUser() user: { id: number }) {
    return this.service.create(dto, user.id);
  }

  @Roles('admin', 'registrar')
  @Patch(':id/status')
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }
}
