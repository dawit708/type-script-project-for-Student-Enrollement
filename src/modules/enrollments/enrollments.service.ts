import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Student } from '../../database/entities/student.entity';
import { Section } from '../../database/entities/section.entity';
import { Semester } from '../../database/entities/semester.entity';
import { Course } from '../../database/entities/course.entity';
import { CoursePrerequisite } from '../../database/entities/course-prerequisite.entity';
import { Grade } from '../../database/entities/grade.entity';
import { Notification } from '../../database/entities/notification.entity';
import { Setting } from '../../database/entities/setting.entity';

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment) private repo: Repository<Enrollment>,
    @InjectRepository(Student) private students: Repository<Student>,
    @InjectRepository(Section) private sections: Repository<Section>,
    @InjectRepository(CoursePrerequisite) private prereqs: Repository<CoursePrerequisite>,
    @InjectRepository(Setting) private settings: Repository<Setting>,
    private dataSource: DataSource,
  ) {}

  // ---------- helpers ----------
  private strip(e: Enrollment) {
    if (e.student?.user) delete (e.student.user as any).password_hash;
    if (e.section?.teacher?.user) delete (e.section.teacher.user as any).password_hash;
    return e;
  }

  private today() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  // Rule 1: enrollment period must be open
  private assertOpen(sem: Semester) {
    if (!sem.is_enrollment_open) throw new BadRequestException('Enrollment is closed for this semester');
    const today = this.today();
    if (sem.enrollment_start && today < String(sem.enrollment_start)) {
      throw new BadRequestException('Enrollment has not started yet');
    }
    if (sem.enrollment_end && today > String(sem.enrollment_end)) {
      throw new BadRequestException('Enrollment period has ended');
    }
  }

  private async passMark() {
    const s = await this.settings.findOne({ where: { setting_key: 'pass_mark' } });
    return s ? Number(s.setting_value) : 50;
  }

  // Rule 4: all prerequisite courses must be passed
  private async assertPrerequisites(studentId: number, courseId: number) {
    const reqs = await this.prereqs.find({ where: { course_id: courseId }, relations: { prerequisite: true } });
    if (!reqs.length) return;

    const pm = await this.passMark();
    const missing: string[] = [];
    for (const r of reqs) {
      const passed = await this.repo
        .createQueryBuilder('e')
        .innerJoin('e.section', 's')
        .innerJoin(Grade, 'g', 'g.enrollment_id = e.id')
        .where('e.student_id = :sid', { sid: studentId })
        .andWhere('s.course_id = :cid', { cid: r.prerequisite_id })
        .andWhere("e.status = 'approved'")
        .andWhere('g.total_mark >= :pm', { pm })
        .getCount();
      if (!passed) missing.push(`${r.prerequisite.code} ${r.prerequisite.name}`);
    }
    if (missing.length) throw new BadRequestException(`Prerequisite not passed: ${missing.join(', ')}`);
  }

  // Rule 5: no time overlap with the student's other pending/approved sections
  private async assertNoScheduleConflict(studentId: number, section: Section) {
    const clash = await this.repo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.section', 's')
      .innerJoinAndSelect('s.course', 'c')
      .where('e.student_id = :sid', { sid: studentId })
      .andWhere("e.status IN ('pending','approved')")
      .andWhere('s.semester_id = :sem', { sem: section.semester_id })
      .andWhere('s.day_of_week = :day', { day: section.day_of_week })
      .andWhere('s.start_time < :end AND s.end_time > :start', { start: section.start_time, end: section.end_time })
      .getOne();
    if (clash) {
      throw new ConflictException(
        `Schedule conflict with ${clash.section.course.code} (${clash.section.day_of_week} ${clash.section.start_time}-${clash.section.end_time})`,
      );
    }
  }

  // ---------- student ----------
  async request(userId: number, sectionId: number) {
    const student = await this.students.findOne({ where: { user_id: userId } });
    if (!student) throw new NotFoundException('Student profile not found');
    if (student.status !== 'active') throw new ForbiddenException('Only active students can enroll');

    const section = await this.sections.findOne({ where: { id: sectionId }, relations: { course: true, semester: true } });
    if (!section) throw new NotFoundException('Section not found');

    // Rule 1
    this.assertOpen(section.semester);

    // Rule 2: same course already requested or joined in this semester (any section)
    const dup = await this.repo
      .createQueryBuilder('e')
      .innerJoin('e.section', 's')
      .where('e.student_id = :sid', { sid: student.id })
      .andWhere('s.semester_id = :sem', { sem: section.semester_id })
      .andWhere('s.course_id = :cid', { cid: section.course_id })
      .andWhere("e.status IN ('pending','approved')")
      .getCount();
    if (dup) throw new ConflictException('You already requested or joined this course in this semester');

    // Rule 3: capacity
    if (section.enrolled_count >= section.capacity) throw new BadRequestException('This section is full');

    // Rule 4 and 5
    await this.assertPrerequisites(student.id, section.course_id);
    await this.assertNoScheduleConflict(student.id, section);

    // a rejected or dropped row is reused because (student_id, section_id) is unique
    const old = await this.repo.findOne({ where: { student_id: student.id, section_id: sectionId } });
    if (old) {
      await this.repo.update(old.id, { status: 'pending', reject_reason: null, reviewed_by: null } as any);
      return this.repo.findOne({ where: { id: old.id } });
    }
    return this.repo.save(this.repo.create({ student_id: student.id, section_id: sectionId }));
  }

  async mine(userId: number, status?: string) {
    const student = await this.students.findOne({ where: { user_id: userId } });
    if (!student) throw new NotFoundException('Student profile not found');
    const where: any = { student_id: student.id };
    if (status) where.status = status;
    const list = await this.repo.find({
      where,
      relations: { section: { course: true, teacher: { user: true }, semester: true } },
      order: { id: 'DESC' },
    });
    return list.map((e) => this.strip(e));
  }

  async schedule(userId: number) {
    const student = await this.students.findOne({ where: { user_id: userId } });
    if (!student) throw new NotFoundException('Student profile not found');
    const list = await this.repo.find({
      where: { student_id: student.id, status: 'approved', section: { semester: { is_current: true } } },
      relations: { section: { course: true, teacher: { user: true } } },
    });
    return list
      .map((e) => ({
        enrollment_id: e.id,
        course_code: e.section.course.code,
        course_name: e.section.course.name,
        section_name: e.section.section_name,
        day_of_week: e.section.day_of_week,
        start_time: e.section.start_time,
        end_time: e.section.end_time,
        room: e.section.room,
        teacher: e.section.teacher?.user?.full_name ?? null,
      }))
      .sort(
        (a, b) =>
          DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week) ||
          a.start_time.localeCompare(b.start_time),
      );
  }

  async drop(userId: number, id: number) {
    return this.dataSource.transaction(async (m) => {
      const e = await m.findOne(Enrollment, { where: { id } });
      if (!e) throw new NotFoundException('Enrollment not found');

      const student = await m.findOne(Student, { where: { id: e.student_id } });
      if (!student || student.user_id !== userId) throw new ForbiddenException('This is not your enrollment');
      if (!['pending', 'approved'].includes(e.status)) {
        throw new BadRequestException(`This enrollment is already ${e.status}`);
      }

      const section = await m.findOne(Section, { where: { id: e.section_id }, lock: { mode: 'pessimistic_write' } });
      if (!section) throw new NotFoundException('Section not found');
      const sem = await m.findOne(Semester, { where: { id: section.semester_id } });
      if (!sem) throw new NotFoundException('Semester not found');
      this.assertOpen(sem);

      if (e.status === 'approved') {
        if (await m.count(Grade, { where: { enrollment_id: e.id } })) {
          throw new BadRequestException('Cannot drop a course that already has grades');
        }
        section.enrolled_count = Math.max(0, section.enrolled_count - 1);
        await m.save(section);
      }
      e.status = 'dropped';
      await m.save(e);
      return { message: 'Course dropped' };
    });
  }

  // ---------- registrar / admin ----------
  async findAll(f: { status?: string; section_id?: number; semester_id?: number; student_id?: number }) {
    const where: any = {};
    if (f.status) where.status = f.status;
    if (f.section_id) where.section_id = f.section_id;
    if (f.student_id) where.student_id = f.student_id;
    if (f.semester_id) where.section = { semester_id: f.semester_id };
    const list = await this.repo.find({
      where,
      relations: { student: { user: true }, section: { course: true, semester: true } },
      order: { id: 'DESC' },
    });
    return list.map((e) => this.strip(e));
  }

  async approve(id: number, reviewerId: number) {
    await this.dataSource.transaction(async (m) => {
      const e = await m.findOne(Enrollment, { where: { id } });
      if (!e) throw new NotFoundException('Enrollment not found');
      if (e.status !== 'pending') throw new BadRequestException('Only pending requests can be approved');

      // lock the section row so two approvals cannot overfill it
      const section = await m.findOne(Section, { where: { id: e.section_id }, lock: { mode: 'pessimistic_write' } });
      if (!section) throw new NotFoundException('Section not found');
      if (section.enrolled_count >= section.capacity) throw new BadRequestException('This section is full');

      section.enrolled_count += 1;
      await m.save(section);

      e.status = 'approved';
      e.reviewed_by = reviewerId;
      e.reject_reason = null as any;
      await m.save(e);

      const course = await m.findOne(Course, { where: { id: section.course_id } });
      const student = await m.findOne(Student, { where: { id: e.student_id } });
      await m.save(
        m.create(Notification, {
          user_id: student!.user_id,
          title: 'Enrollment approved',
          message: `Your enrollment in ${course?.code} - ${course?.name} (section ${section.section_name}) was approved.`,
        }),
      );
    });
    return this.repo.findOne({ where: { id } });
  }

  async reject(id: number, reviewerId: number, reason?: string) {
    await this.dataSource.transaction(async (m) => {
      const e = await m.findOne(Enrollment, { where: { id } });
      if (!e) throw new NotFoundException('Enrollment not found');
      if (e.status !== 'pending') throw new BadRequestException('Only pending requests can be rejected');

      e.status = 'rejected';
      e.reviewed_by = reviewerId;
      e.reject_reason = reason ?? (null as any);
      await m.save(e);

      const section = await m.findOne(Section, { where: { id: e.section_id } });
      const course = section ? await m.findOne(Course, { where: { id: section.course_id } }) : null;
      const student = await m.findOne(Student, { where: { id: e.student_id } });
      await m.save(
        m.create(Notification, {
          user_id: student!.user_id,
          title: 'Enrollment rejected',
          message: `Your enrollment in ${course?.code} - ${course?.name} was rejected.${reason ? ' Reason: ' + reason : ''}`,
        }),
      );
    });
    return this.repo.findOne({ where: { id } });
  }
}
