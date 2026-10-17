import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Attendance } from '../../database/entities/attendance.entity';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Section } from '../../database/entities/section.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { Student } from '../../database/entities/student.entity';
import { TakeAttendanceDto } from './dto/create-attendance.dto';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const r2 = (n: number) => Math.round(n * 100) / 100;

type Counts = { present: number; absent: number; late: number; excused: number };

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance) private repo: Repository<Attendance>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
    @InjectRepository(Section) private sections: Repository<Section>,
    @InjectRepository(Teacher) private teachers: Repository<Teacher>,
    @InjectRepository(Student) private students: Repository<Student>,
  ) {}

  private today() {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  private async getSection(id: number) {
    const s = await this.sections.findOne({ where: { id }, relations: { course: true } });
    if (!s) throw new NotFoundException('Section not found');
    return s;
  }

  private async assertAccess(section: Section, user: { id: number; role: string }) {
    if (user.role !== 'teacher') return;
    const t = await this.teachers.findOne({ where: { user_id: user.id } });
    if (!t || section.teacher_id !== t.id) throw new ForbiddenException('This is not your section');
  }

  private async counts(ids: number[]) {
    const out = new Map<number, Counts>();
    if (!ids.length) return out;
    const rows = await this.repo
      .createQueryBuilder('a')
      .select('a.enrollment_id', 'enrollment_id')
      .addSelect("SUM(a.status = 'present')", 'present')
      .addSelect("SUM(a.status = 'absent')", 'absent')
      .addSelect("SUM(a.status = 'late')", 'late')
      .addSelect("SUM(a.status = 'excused')", 'excused')
      .where('a.enrollment_id IN (:...ids)', { ids })
      .groupBy('a.enrollment_id')
      .getRawMany();
    rows.forEach((r) =>
      out.set(Number(r.enrollment_id), {
        present: Number(r.present),
        absent: Number(r.absent),
        late: Number(r.late),
        excused: Number(r.excused),
      }),
    );
    return out;
  }

  // excused days are not counted against the student
  private stats(c?: Counts) {
    const present = c?.present ?? 0;
    const absent = c?.absent ?? 0;
    const late = c?.late ?? 0;
    const excused = c?.excused ?? 0;
    const counted = present + absent + late;
    return {
      present,
      absent,
      late,
      excused,
      total_days: counted + excused,
      attendance_rate: counted ? r2(((present + late) / counted) * 100) : null,
    };
  }

  // ---------- teacher ----------
  async take(dto: TakeAttendanceDto, user: { id: number; role: string }) {
    const section = await this.getSection(dto.section_id);
    await this.assertAccess(section, user);

    if (dto.date > this.today()) throw new BadRequestException('Attendance date cannot be in the future');

    const ids = dto.records.map((r) => r.enrollment_id);
    if (new Set(ids).size !== ids.length) throw new BadRequestException('Duplicate students in the list');

    const valid = await this.enrollments.count({ where: { id: In(ids), section_id: section.id, status: 'approved' } });
    if (valid !== ids.length) {
      throw new BadRequestException('Some students are not approved members of this section');
    }

    const existing = await this.repo.find({ where: { enrollment_id: In(ids), attendance_date: dto.date } });
    const exMap = new Map(existing.map((a) => [a.enrollment_id, a.id]));

    const rows = dto.records.map((r) => ({
      id: exMap.get(r.enrollment_id),
      enrollment_id: r.enrollment_id,
      attendance_date: dto.date,
      status: r.status,
      remark: r.remark ?? null,
    }));
    await this.repo.save(rows as any);

    return { message: 'Attendance saved', date: dto.date, saved: rows.length, updated: existing.length };
  }

  // class sheet for one date (default: today)
  async sheet(sectionId: number, date: string | undefined, user: { id: number; role: string }) {
    const section = await this.getSection(sectionId);
    await this.assertAccess(section, user);

    const day = date || this.today();
    if (!DATE_RE.test(day)) throw new BadRequestException('date must be YYYY-MM-DD');

    const enrs = await this.enrollments.find({
      where: { section_id: sectionId, status: 'approved' },
      relations: { student: { user: true } },
      order: { id: 'ASC' },
    });
    const rows = enrs.length
      ? await this.repo.find({ where: { enrollment_id: In(enrs.map((e) => e.id)), attendance_date: day } })
      : [];
    const byEnr = new Map(rows.map((a) => [a.enrollment_id, a]));

    return {
      section: {
        id: section.id,
        course_code: section.course.code,
        course_name: section.course.name,
        section_name: section.section_name,
      },
      date: day,
      taken: rows.length > 0,
      students: enrs.map((e) => ({
        enrollment_id: e.id,
        student_no: e.student.student_no,
        full_name: e.student.user.full_name,
        status: byEnr.get(e.id)?.status ?? null,
        remark: byEnr.get(e.id)?.remark ?? null,
      })),
    };
  }

  // totals per student for one section
  async sectionSummary(sectionId: number, user: { id: number; role: string }) {
    const section = await this.getSection(sectionId);
    await this.assertAccess(section, user);

    const enrs = await this.enrollments.find({
      where: { section_id: sectionId, status: 'approved' },
      relations: { student: { user: true } },
      order: { id: 'ASC' },
    });
    const counts = await this.counts(enrs.map((e) => e.id));

    return {
      section: { id: section.id, course_code: section.course.code, section_name: section.section_name },
      students: enrs.map((e) => ({
        enrollment_id: e.id,
        student_no: e.student.student_no,
        full_name: e.student.user.full_name,
        ...this.stats(counts.get(e.id)),
      })),
    };
  }

  // ---------- student ----------
  async mine(userId: number, sectionId?: number) {
    const student = await this.students.findOne({ where: { user_id: userId } });
    if (!student) throw new NotFoundException('Student profile not found');

    const where: any = { student_id: student.id, status: 'approved' };
    if (sectionId) where.section_id = sectionId;

    const enrs = await this.enrollments.find({
      where,
      relations: { section: { course: true, semester: true } },
      order: { id: 'DESC' },
    });
    const ids = enrs.map((e) => e.id);
    const counts = await this.counts(ids);
    const records =
      sectionId && ids.length
        ? await this.repo.find({ where: { enrollment_id: In(ids) }, order: { attendance_date: 'DESC' } })
        : [];

    return enrs.map((e) => ({
      enrollment_id: e.id,
      course_code: e.section.course.code,
      course_name: e.section.course.name,
      section_name: e.section.section_name,
      semester: `${e.section.semester.academic_year} term ${e.section.semester.term}`,
      ...this.stats(counts.get(e.id)),
      records: sectionId
        ? records
            .filter((r) => r.enrollment_id === e.id)
            .map((r) => ({ date: r.attendance_date, status: r.status, remark: r.remark }))
        : undefined,
    }));
  }
}
