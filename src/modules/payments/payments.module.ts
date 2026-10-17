import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../database/entities/payment.entity';
import { Student } from '../../database/entities/student.entity';
import { Semester } from '../../database/entities/semester.entity';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Notification } from '../../database/entities/notification.entity';
import { Setting } from '../../database/entities/setting.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Student, Semester, Enrollment, Notification, Setting])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
