import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../../database/entities/attendance.entity';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Section } from '../../database/entities/section.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { Student } from '../../database/entities/student.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Enrollment, Section, Teacher, Student])],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
