import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Grade } from '../../database/entities/grade.entity';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Section } from '../../database/entities/section.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { Student } from '../../database/entities/student.entity';
import { Notification } from '../../database/entities/notification.entity';
import { Setting } from '../../database/entities/setting.entity';
import { SaveGradeDto } from './dto/create-grades.dto';

const num = (v: any) => (v === null || v === undefined ? null : Number(v));
const r2 = (n: number) => Math.round(n * 100) / 100;
const TERM_ORDER = ['1', '2', 'summer'];

function letterFor(total: number): { letter: string; point: number } {
  if (total >= 90) return { letter: 'A', point: 4.0 };
  if (total >= 85) return { letter: 'A-', point: 3.75 };
  if (total >= 80) return { letter: 'B+', point: 3.5 };
  if (total >= 75) return { letter: 'B', point: 3.0 };
  if (total >= 70) return { letter: 'B-', point: 2.75 };
  if (total >= 65) return { letter: 'C+', point: 2.5 };
  if (total >= 60) return { letter: 'C', point: 2.0 };
  if (total >= 50) return { letter: 'D', point: 1.0 };
  return { letter: 'F', point: 0 };
}

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade) private grades: Repository<Grade>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
    @InjectRepository(Section) private sections: Repository<Section>,
    @InjectRepository(Teacher) private teachers: Repository<Teacher>,
    @InjectRepository(Student) private students: Repository<Student>,
    @InjectRepository(Notification) private notifications: Repository<Notification>,
    @InjectRepository(Setting) private settings: Repository<Setting>,
  ) {}

  private view(g: Grade) {
    return {
      id: g.id,
      enrollment_id: g.enrollment_id,
      assignment_mark: num(g.assignment_mark),
      midterm_mark: num(g.midterm_mark),
      final_mark: num(g.final_mark),
      total_mark: num(g.total_mark),
      letter_grade: g.letter_grade,
      grade_point: num(g.grade_point),
    };
  }

  private async passMark() {
    const s = await this.settings.findOne({ where: { setting_key: 'pass_mark' } });
    return s ? Number(s.setting_value) : 50;
  }

  // a teacher may only work on his own sections
  private async assertSectionAccess(section: Section, user: { id: number; role: string }) {
    if (user.role !== 'teacher') return;
    const t = await this.teachers.findOne({ where: { user_id: user.id } });
    if (!t || section.teacher_id !== t.id) throw new ForbiddenException('This is not your section');
  }

  async save(dto: SaveGradeDto, user: { id: number; role: string }) {
    const enr = await this.enrollments.findOne({
      where: { id: dto.enrollment_id },
      relations: { section: { course: true }, student: true },
    });
    if (!enr) throw new NotFoundException('Enrollment not found');
    if (enr.status !== 'approved') {
      throw new BadRequestException('Grades can only be entered for approved enrollments');
    }
    await this.assertSectionAccess(enr.section, user);

    let g = await this.grades.findOne({ where: { enrollment_id: enr.id } });
    const wasComplete = g ? num(g.total_mark) !== null : false;
    if (!g) g = this.grades.create({ enrollment_id: enr.id });

    for (const f of ['assignment_mark', 'midterm_mark', 'final_mark'] as const) {
      if ((dto as any)[f] !== undefined) (g as any)[f] = (dto as any)[f];
    }
    g.entered_by = user.id;

    const a = num(g.assignment_mark);
    const m = num(g.midterm_mark);
    const f = num(g.final_mark);
    const complete = a !== null && m !== null && f !== null;
    if (complete) {
      const total = r2(a + m + f);
      const { letter, point } = letterFor(total);
      g.total_mark = total;
      g.letter_grade = letter;
      g.grade_point = point;
    } else {
      g.total_mark = null as any;
      g.letter_grade = null as any;
      g.grade_point = null as any;
    }

    const saved = await this.grades.save(g);

    if (complete && !wasComplete) {
      await this.notifications.save(
        this.notifications.create({
          user_id: enr.student.user_id,
          title: 'Grade posted',
          message: `Your grade for ${enr.section.course.code} - ${enr.section.course.name} is ${saved.letter_grade} (${num(saved.total_mark)}/100).`,
        }),
      );
    }
    return this.view(saved);
  }

  // all students of one section with their grade (teacher dashboard)
  async findBySection(sectionId: number, user: { id: number; role: string }) {
    const section = await this.sections.findOne({ where: { id: sectionId }, relations: { course: true } });
    if (!section) throw new NotFoundException('Section not found');
    await this.assertSectionAccess(section, user);

    const enrs = await this.enrollments.find({
      where: { section_id: sectionId, status: 'approved' },
      relations: { student: { user: true } },
      order: { id: 'ASC' },
    });
    const grades = enrs.length ? await this.grades.find({ where: { enrollment_id: In(enrs.map((e) => e.id)) } }) : [];
    const byEnr = new Map(grades.map((g) => [g.enrollment_id, g]));

    return {
      section: {
        id: section.id,
        course_code: section.course.code,
        course_name: section.course.name,
        section_name: section.section_name,
      },
      students: enrs.map((e) => {
        const g = byEnr.get(e.id);
        return {
          enrollment_id: e.id,
          student_no: e.student.student_no,
          full_name: e.student.user.full_name,
          grade: g ? this.view(g) : null,
        };
      }),
    };
  }

  async mine(userId: number) {
    const student = await this.students.findOne({ where: { user_id: userId } });
    if (!student) throw new NotFoundException('Student profile not found');
    return this.transcript(student.id);
  }

  async transcript(studentId: number) {
    const student = await this.students.findOne({ where: { id: studentId }, relations: { user: true, program: true } });
    if (!student) throw new NotFoundException('Student not found');

    const pm = await this.passMark();
    const grades = await this.grades.find({
      where: { enrollment: { student_id: studentId, status: 'approved' } },
      relations: { enrollment: { section: { course: true, semester: true } } },
    });

    const bySem = new Map<number, any>();
    for (const g of grades) {
      const { course, semester } = g.enrollment.section;
      const total = num(g.total_mark);
      if (!bySem.has(semester.id)) {
        bySem.set(semester.id, {
          semester_id: semester.id,
          academic_year: semester.academic_year,
          term: semester.term,
          courses: [],
        });
      }
      bySem.get(semester.id).courses.push({
        course_code: course.code,
        course_name: course.name,
        credit_hours: course.credit_hours,
        assignment_mark: num(g.assignment_mark),
        midterm_mark: num(g.midterm_mark),
        final_mark: num(g.final_mark),
        total_mark: total,
        letter_grade: g.letter_grade,
        grade_point: num(g.grade_point),
        passed: total === null ? null : total >= pm,
      });
    }

    let allPoints = 0;
    let allCredits = 0;
    let earned = 0;

    const semesters = [...bySem.values()]
      .sort(
        (a, b) =>
          a.academic_year.localeCompare(b.academic_year) || TERM_ORDER.indexOf(a.term) - TERM_ORDER.indexOf(b.term),
      )
      .map((s) => {
        let points = 0;
        let credits = 0;
        for (const c of s.courses) {
          if (c.total_mark === null) continue; // not fully graded yet
          points += c.grade_point * c.credit_hours;
          credits += c.credit_hours;
          if (c.passed) earned += c.credit_hours;
        }
        allPoints += points;
        allCredits += credits;
        return { ...s, credits, gpa: credits ? r2(points / credits) : null };
      });

    return {
      student: {
        id: student.id,
        student_no: student.student_no,
        full_name: student.user.full_name,
        program: student.program?.name ?? null,
      },
      semesters,
      cumulative_gpa: allCredits ? r2(allPoints / allCredits) : null,
      credits_attempted: allCredits,
      credits_earned: earned,
    };
  }
}
