import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Student } from '../../database/entities/student.entity';
import { Section } from '../../database/entities/section.entity';
import { Semester } from '../../database/entities/semester.entity';
import { Course } from '../../database/entities/course.entity';
import { CoursePrerequisite } from '../../database/entities/course-prerequisite.entity';
import { Grade } from '../../database/entities/grade.entity';
import { Notification } from '../../database/entities/notification.entity';
import { Setting } from '../../database/entities/setting.entity';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Enrollment, Student, Section, Semester, Course,
      CoursePrerequisite, Grade, Notification, Setting,
    ]),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
