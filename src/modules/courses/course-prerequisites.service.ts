import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../database/entities/course.entity';
import { CoursePrerequisite } from '../../database/entities/course-prerequisite.entity';

@Injectable()
export class CoursePrerequisitesService {
  constructor(
    @InjectRepository(CoursePrerequisite) private repo: Repository<CoursePrerequisite>,
    @InjectRepository(Course) private courses: Repository<Course>,
  ) {}

  private async ensureCourse(id: number) {
    if (!(await this.courses.count({ where: { id } }))) throw new NotFoundException(`Course ${id} not found`);
  }

  async list(courseId: number) {
    await this.ensureCourse(courseId);
    const rows = await this.repo.find({ where: { course_id: courseId }, relations: { prerequisite: true } });
    return rows.map((r) => ({
      id: r.id,
      prerequisite_id: r.prerequisite_id,
      code: r.prerequisite.code,
      name: r.prerequisite.name,
      credit_hours: r.prerequisite.credit_hours,
    }));
  }

  async add(courseId: number, prerequisiteId: number) {
    if (courseId === prerequisiteId) throw new BadRequestException('A course cannot be its own prerequisite');
    await this.ensureCourse(courseId);
    await this.ensureCourse(prerequisiteId);

    if (await this.requires(prerequisiteId, courseId)) {
      throw new BadRequestException('Circular prerequisite: that course already depends on this one');
    }
    try {
      await this.repo.save(this.repo.create({ course_id: courseId, prerequisite_id: prerequisiteId }));
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') throw new ConflictException('This prerequisite is already added');
      throw e;
    }
    return this.list(courseId);
  }

  async remove(courseId: number, prerequisiteId: number) {
    const row = await this.repo.findOne({ where: { course_id: courseId, prerequisite_id: prerequisiteId } });
    if (!row) throw new NotFoundException('Prerequisite not found');
    await this.repo.delete(row.id);
    return this.list(courseId);
  }

  // does course "startId" need "targetId" directly or through other courses?
  private async requires(startId: number, targetId: number) {
    const seen = new Set<number>();
    const stack = [startId];
    while (stack.length) {
      const id = stack.pop() as number;
      if (id === targetId) return true;
      if (seen.has(id)) continue;
      seen.add(id);
      const rows = await this.repo.find({ where: { course_id: id } });
      rows.forEach((r) => stack.push(r.prerequisite_id));
    }
    return false;
  }
}
