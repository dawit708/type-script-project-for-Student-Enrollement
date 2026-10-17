import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from '../../database/entities/course.entity';
import { CoursePrerequisite } from '../../database/entities/course-prerequisite.entity';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CoursePrerequisitesController } from './course-prerequisites.controller';
import { CoursePrerequisitesService } from './course-prerequisites.service';

@Module({
  imports: [TypeOrmModule.forFeature([Course, CoursePrerequisite])],
  controllers: [CoursesController, CoursePrerequisitesController],
  providers: [CoursesService, CoursePrerequisitesService],
  exports: [CoursesService],
})
export class CoursesModule {}
