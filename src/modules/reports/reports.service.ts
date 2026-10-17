import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

const n = (v: any) => Number(v ?? 0);
const r1 = (x: number) => Math.round(x * 10) / 10;
const r2 = (x: number) => Math.round(x * 100) / 100;
const LETTERS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'];

function byStatus(rows: any[], keys: string[]) {
  const out: Record<string, number> = {};
  keys.forEach((k) => (out[k] = 0));
  rows.forEach((r) => (out[r.status] = n(r.c)));
  return out;
}

@Injectable()
export class ReportsService {
  constructor(private ds: DataSource) {}

  private q(sql: string, params: any[] = []) {
    return this.ds.query(sql, params);
  }

  private async semester(semesterId?: number) {
    const rows = semesterId
      ? await this.q('SELECT id, academic_year, term FROM semesters WHERE id = ?', [semesterId])
      : await this.q('SELECT id, academic_year, term FROM semesters WHERE is_current = 1 ORDER BY id DESC LIMIT 1');
    if (!rows.length) throw new NotFoundException(semesterId ? 'Semester not found' : 'No current semester is set');
    return rows[0];
  }

  private async passMark() {
    const rows = await this.q("SELECT setting_value FROM settings WHERE setting_key = 'pass_mark'");
    const v = rows.length ? Number(rows[0].setting_value) : 50;
    return Number.isFinite(v) ? v : 50;
  }

  async overview() {
    const [students, teachers, courses, programs, departments, roles, cur] = await Promise.all([
      this.q('SELECT status, COUNT(*) AS c FROM students GROUP BY status'),
      this.q('SELECT COUNT(*) AS c FROM teachers'),
      this.q('SELECT COUNT(*) AS c FROM courses'),
      this.q('SELECT COUNT(*) AS c FROM programs'),
      this.q('SELECT COUNT(*) AS c FROM departments'),
      this.q('SELECT r.name, COUNT(u.id) AS c FROM roles r LEFT JOIN users u ON u.role_id = r.id GROUP BY r.name'),
      this.q(
        'SELECT id, academic_year, term, is_enrollment_open FROM semesters WHERE is_current = 1 ORDER BY id DESC LIMIT 1',
      ),
    ]);

    const studentsBy = byStatus(students, ['active', 'graduated', 'dropped', 'suspended']);
    const usersByRole: Record<string, number> = {};
    roles.forEach((r: any) => (usersByRole[r.name] = n(r.c)));

    let current_semester: any = null;
    if (cur.length) {
      const sem = cur[0];
      const [secs, enr, pay] = await Promise.all([
        this.q(
          'SELECT COUNT(*) AS c, COALESCE(SUM(capacity),0) AS capacity, COALESCE(SUM(enrolled_count),0) AS enrolled FROM sections WHERE semester_id = ?',
          [sem.id],
        ),
        this.q(
          'SELECT e.status, COUNT(*) AS c FROM enrollments e JOIN sections s ON s.id = e.section_id WHERE s.semester_id = ? GROUP BY e.status',
          [sem.id],
        ),
        this.q("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE semester_id = ? AND status = 'paid'", [
          sem.id,
        ]),
      ]);
      const capacity = n(secs[0].capacity);
      const enrolled = n(secs[0].enrolled);
      current_semester = {
        id: sem.id,
        academic_year: sem.academic_year,
        term: sem.term,
        enrollment_open: !!n(sem.is_enrollment_open),
        sections: n(secs[0].c),
        capacity,
        enrolled,
        fill_rate: capacity ? r1((enrolled / capacity) * 100) : 0,
        enrollments: byStatus(enr, ['pending', 'approved', 'rejected', 'dropped']),
        payments_collected: r2(n(pay[0].total)),
      };
    }

    return {
      totals: {
        students: { total: Object.values(studentsBy).reduce((a, b) => a + b, 0), by_status: studentsBy },
        teachers: n(teachers[0].c),
        courses: n(courses[0].c),
        programs: n(programs[0].c),
        departments: n(departments[0].c),
        users_by_role: usersByRole,
      },
      current_semester,
    };
  }

  async enrollment(semesterId?: number) {
    const sem = await this.semester(semesterId);

    const [totals, courses, pending] = await Promise.all([
      this.q(
        'SELECT e.status, COUNT(*) AS c FROM enrollments e JOIN sections s ON s.id = e.section_id WHERE s.semester_id = ? GROUP BY e.status',
        [sem.id],
      ),
      this.q(
        `SELECT c.id AS course_id, c.code, c.name,
                COUNT(s.id) AS sections,
                COALESCE(SUM(s.capacity),0) AS capacity,
                COALESCE(SUM(s.enrolled_count),0) AS enrolled
         FROM sections s JOIN courses c ON c.id = s.course_id
         WHERE s.semester_id = ?
         GROUP BY c.id, c.code, c.name
         ORDER BY enrolled DESC, c.code ASC`,
        [sem.id],
      ),
      this.q(
        `SELECT s.course_id, COUNT(*) AS c
         FROM enrollments e JOIN sections s ON s.id = e.section_id
         WHERE s.semester_id = ? AND e.status = 'pending'
         GROUP BY s.course_id`,
        [sem.id],
      ),
    ]);

    const pend = new Map<number, number>(pending.map((r: any) => [n(r.course_id), n(r.c)]));
    return {
      semester: sem,
      totals: byStatus(totals, ['pending', 'approved', 'rejected', 'dropped']),
      by_course: courses.map((c: any) => {
        const capacity = n(c.capacity);
        const enrolled = n(c.enrolled);
        return {
          course_id: n(c.course_id),
          code: c.code,
          name: c.name,
          sections: n(c.sections),
          capacity,
          enrolled,
          pending: pend.get(n(c.course_id)) ?? 0,
          fill_rate: capacity ? r1((enrolled / capacity) * 100) : 0,
        };
      }),
    };
  }

  async studentsByProgram() {
    const rows = await this.q(
      `SELECT p.id, p.code, p.name, COUNT(st.id) AS students, COALESCE(SUM(st.status = 'active'),0) AS active
       FROM programs p LEFT JOIN students st ON st.program_id = p.id
       GROUP BY p.id, p.code, p.name
       ORDER BY students DESC, p.code ASC`,
    );
    return rows.map((r: any) => ({
      program_id: n(r.id),
      code: r.code,
      name: r.name,
      students: n(r.students),
      active: n(r.active),
    }));
  }

  async grades(semesterId?: number) {
    const sem = await this.semester(semesterId);
    const pm = await this.passMark();
    const from = `FROM grades g
                  JOIN enrollments e ON e.id = g.enrollment_id
                  JOIN sections s ON s.id = e.section_id
                  WHERE s.semester_id = ? AND g.total_mark IS NOT NULL`;

    const dist = await this.q(`SELECT g.letter_grade AS letter, COUNT(*) AS c ${from} GROUP BY g.letter_grade`, [
      sem.id,
    ]);
    const agg = await this.q(
      `SELECT COUNT(*) AS total, AVG(g.total_mark) AS average, COALESCE(SUM(g.total_mark >= ?),0) AS passed ${from}`,
      [pm, sem.id],
    );

    const counts: Record<string, number> = {};
    LETTERS.forEach((l) => (counts[l] = 0));
    dist.forEach((r: any) => (counts[r.letter] = n(r.c)));

    const total = n(agg[0].total);
    const passed = n(agg[0].passed);
    return {
      semester: sem,
      pass_mark: pm,
      graded: total,
      average_mark: total ? r2(n(agg[0].average)) : null,
      passed,
      failed: total - passed,
      pass_rate: total ? r1((passed / total) * 100) : null,
      distribution: counts,
    };
  }

  async payments(semesterId?: number) {
    const sem = await this.semester(semesterId);
    const rows = await this.q(
      `SELECT status, method, COUNT(*) AS c, COALESCE(SUM(amount),0) AS total
       FROM payments WHERE semester_id = ? GROUP BY status, method`,
      [sem.id],
    );

    const by_status: Record<string, { count: number; total: number }> = {};
    ['pending', 'paid', 'failed', 'refunded'].forEach((s) => (by_status[s] = { count: 0, total: 0 }));
    const paid_by_method: Record<string, number> = {};

    rows.forEach((r: any) => {
      by_status[r.status].count += n(r.c);
      by_status[r.status].total = r2(by_status[r.status].total + n(r.total));
      if (r.status === 'paid') paid_by_method[r.method] = r2(n(r.total));
    });

    return { semester: sem, by_status, paid_by_method, collected: by_status.paid.total };
  }
}
