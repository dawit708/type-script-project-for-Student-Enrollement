import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grade } from '../../database/entities/grade.entity';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Section } from '../../database/entities/section.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { Student } from '../../database/entities/student.entity';
import { Notification } from '../../database/entities/notification.entity';
import { Setting } from '../../database/entities/setting.entity';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

@Module({
  imports: [TypeOrmModule.forFeature([Grade, Enrollment, Section, Teacher, Student, Notification, Setting])],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
