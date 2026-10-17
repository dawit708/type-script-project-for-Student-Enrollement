import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../../common/base/base-crud.service';
import { Course } from '../../database/entities/course.entity';

@Injectable()
export class CoursesService extends BaseCrudService<Course> {
  constructor(@InjectRepository(Course) private courseRepo: Repository<Course>) {
    super(courseRepo, { department: true });
  }

  // ordered by year, then semester, then code; every filter is optional
  list(f: { year_level?: number; semester_no?: number; course_type?: string; department_id?: number }) {
    const where: any = {};
    if (f.year_level) where.year_level = f.year_level;
    if (f.semester_no) where.semester_no = f.semester_no;
    if (f.course_type) where.course_type = f.course_type;
    if (f.department_id) where.department_id = f.department_id;
    return this.courseRepo.find({
      where,
      relations: { department: true },
      order: { year_level: 'ASC', semester_no: 'ASC', code: 'ASC' },
    });
  }
}
