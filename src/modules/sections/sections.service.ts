import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from '../../database/entities/section.entity';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { CreateSectionDto } from './dto/create-sections.dto';
import { UpdateSectionDto } from './dto/update-sections.dto';

const norm = (t: string) => (t.length === 5 ? t + ':00' : t);

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(Section) private repo: Repository<Section>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
    @InjectRepository(Teacher) private teachers: Repository<Teacher>,
  ) {}

  private view(s: Section) {
    if (s.teacher?.user) delete (s.teacher.user as any).password_hash;
    return { ...s, seats_left: s.capacity - s.enrolled_count };
  }

  private checkTimes(start: string, end: string) {
    if (norm(end) <= norm(start)) throw new BadRequestException('end_time must be after start_time');
  }

  // room and teacher must be free at that day/time in the same semester
  private async checkConflicts(
    d: { semester_id: number; day_of_week: string; start_time: string; end_time: string; room?: string; teacher_id?: number },
    ignoreId?: number,
  ) {
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.semester_id = :sem', { sem: d.semester_id })
      .andWhere('s.day_of_week = :day', { day: d.day_of_week })
      .andWhere('s.start_time < :end AND s.end_time > :start', { start: norm(d.start_time), end: norm(d.end_time) });
    if (ignoreId) qb.andWhere('s.id != :id', { id: ignoreId });

    for (const s of await qb.getMany()) {
      if (d.room && s.room === d.room) throw new ConflictException(`Room ${d.room} is already used at this time`);
      if (d.teacher_id && s.teacher_id === d.teacher_id) {
        throw new ConflictException('This teacher already has another class at this time');
      }
    }
  }

  private dbError(e: any): never {
    if (e.code === 'ER_DUP_ENTRY') {
      throw new ConflictException('This section name already exists for the course in this semester');
    }
    if (e.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new BadRequestException('Course, teacher or semester does not exist');
    }
    throw e;
  }

  async findAll(f: { semester_id?: number; course_id?: number; teacher_id?: number }) {
    const where: any = {};
    if (f.semester_id) where.semester_id = f.semester_id;
    if (f.course_id) where.course_id = f.course_id;
    if (f.teacher_id) where.teacher_id = f.teacher_id;
    const list = await this.repo.find({
      where,
      relations: { course: true, teacher: { user: true }, semester: true },
      order: { id: 'DESC' },
    });
    return list.map((s) => this.view(s));
  }

  async findOne(id: number) {
    const s = await this.repo.findOne({
      where: { id },
      relations: { course: true, teacher: { user: true }, semester: true },
    });
    if (!s) throw new NotFoundException('Section not found');
    return this.view(s);
  }

  async findMine(userId: number) {
    const t = await this.teachers.findOne({ where: { user_id: userId } });
    if (!t) throw new NotFoundException('Teacher profile not found');
    return this.findAll({ teacher_id: t.id });
  }

  async create(dto: CreateSectionDto) {
    this.checkTimes(dto.start_time, dto.end_time);
    await this.checkConflicts(dto);
    try {
      const saved = await this.repo.save(this.repo.create(dto));
      return this.findOne(saved.id);
    } catch (e) {
      this.dbError(e);
    }
  }

  async update(id: number, dto: UpdateSectionDto) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Section not found');

    const merged = { ...cur, ...dto };
    this.checkTimes(merged.start_time, merged.end_time);
    await this.checkConflicts(merged, id);
    if (dto.capacity !== undefined && dto.capacity < cur.enrolled_count) {
      throw new BadRequestException('Capacity cannot be less than the students already enrolled');
    }

    const patch: any = {};
    Object.entries(dto).forEach(([k, v]) => {
      if (v !== undefined) patch[k] = v;
    });
    try {
      if (Object.keys(patch).length) await this.repo.update(id, patch);
    } catch (e) {
      this.dbError(e);
    }
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    // enrollments are ON DELETE CASCADE, so never delete a section that has students
    const used = await this.enrollments.count({ where: { section_id: id } });
    if (used > 0) throw new ConflictException('Cannot delete: this section already has enrollment records');
    await this.repo.delete(id);
    return { message: 'Deleted successfully' };
  }

  async classList(sectionId: number, user: { id: number; role: string }) {
    const section = await this.repo.findOne({ where: { id: sectionId }, relations: { course: true } });
    if (!section) throw new NotFoundException('Section not found');

    if (user.role === 'teacher') {
      const t = await this.teachers.findOne({ where: { user_id: user.id } });
      if (!t || section.teacher_id !== t.id) throw new ForbiddenException('This is not your section');
    }

    const list = await this.enrollments.find({
      where: { section_id: sectionId, status: 'approved' },
      relations: { student: { user: true } },
      order: { id: 'ASC' },
    });

    return {
      section: {
        id: section.id,
        course_code: section.course.code,
        course_name: section.course.name,
        section_name: section.section_name,
        capacity: section.capacity,
        enrolled_count: section.enrolled_count,
      },
      students: list.map((e) => ({
        enrollment_id: e.id,
        student_id: e.student_id,
        student_no: e.student.student_no,
        full_name: e.student.user.full_name,
        email: e.student.user.email,
      })),
    };
  }
}
