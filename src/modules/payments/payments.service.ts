import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Payment } from '../../database/entities/payment.entity';
import { Student } from '../../database/entities/student.entity';
import { Semester } from '../../database/entities/semester.entity';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Notification } from '../../database/entities/notification.entity';
import { Setting } from '../../database/entities/setting.entity';
import { CreatePaymentDto } from './dto/create-payments.dto';

const r2 = (n: number) => Math.round(n * 100) / 100;
const TERM_ORDER = ['1', '2', 'summer'];
const ALLOWED: Record<string, string[]> = {
  pending: ['paid', 'failed'],
  paid: ['refunded'],
  failed: [],
  refunded: [],
};

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private repo: Repository<Payment>,
    @InjectRepository(Student) private students: Repository<Student>,
    @InjectRepository(Semester) private semesters: Repository<Semester>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
    @InjectRepository(Notification) private notifications: Repository<Notification>,
    @InjectRepository(Setting) private settings: Repository<Setting>,
  ) {}

  private view(p: Payment) {
    if (p.student?.user) delete (p.student.user as any).password_hash;
    return { ...p, amount: Number(p.amount) };
  }

  private async feeRate() {
    const s = await this.settings.findOne({ where: { setting_key: 'fee_per_credit_hour' } });
    const n = s ? Number(s.setting_value) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  private async notify(userId: number, title: string, message: string) {
    await this.notifications.save(this.notifications.create({ user_id: userId, title, message }));
  }

  async create(dto: CreatePaymentDto, recorderId: number) {
    const student = await this.students.findOne({ where: { id: dto.student_id } });
    if (!student) throw new NotFoundException('Student not found');
    if (!(await this.semesters.count({ where: { id: dto.semester_id } }))) {
      throw new NotFoundException('Semester not found');
    }

    const status = dto.status ?? 'paid';
    const saved = await this.repo.save(
      this.repo.create({
        student_id: dto.student_id,
        semester_id: dto.semester_id,
        amount: dto.amount,
        method: dto.method ?? 'cash',
        reference_no: dto.reference_no,
        status,
        recorded_by: recorderId,
        paid_at: status === 'paid' ? new Date() : undefined,
      }),
    );

    if (status === 'paid') {
      await this.notify(student.user_id, 'Payment received', `Your payment of ${dto.amount} was received.`);
    }
    return this.view(saved);
  }

  async updateStatus(id: number, status: string) {
    const p = await this.repo.findOne({ where: { id }, relations: { student: true } });
    if (!p) throw new NotFoundException('Payment not found');
    if (!ALLOWED[p.status]?.includes(status)) {
      throw new BadRequestException(`Cannot change status from "${p.status}" to "${status}"`);
    }
    p.status = status;
    if (status === 'paid') p.paid_at = new Date();
    const saved = await this.repo.save(p);

    if (status === 'paid') {
      await this.notify(p.student.user_id, 'Payment received', `Your payment of ${Number(p.amount)} was received.`);
    }
    if (status === 'refunded') {
      await this.notify(p.student.user_id, 'Payment refunded', `Your payment of ${Number(p.amount)} was refunded.`);
    }
    const { student, ...rest } = saved as any;
    return { ...rest, amount: Number(saved.amount) };
  }

  async findAll(f: { student_id?: number; semester_id?: number; status?: string }) {
    const where: any = {};
    if (f.student_id) where.student_id = f.student_id;
    if (f.semester_id) where.semester_id = f.semester_id;
    if (f.status) where.status = f.status;
    const list = await this.repo.find({
      where,
      relations: { student: { user: true }, semester: true },
      order: { id: 'DESC' },
      take: 200,
    });
    return list.map((p) => this.view(p));
  }

  async mine(userId: number) {
    const student = await this.students.findOne({ where: { user_id: userId } });
    if (!student) throw new NotFoundException('Student profile not found');
    return this.summary(student.id);
  }

  async summary(studentId: number) {
    const student = await this.students.findOne({ where: { id: studentId }, relations: { user: true } });
    if (!student) throw new NotFoundException('Student not found');

    const rate = await this.feeRate();
    const payments = await this.repo.find({
      where: { student_id: studentId },
      relations: { semester: true },
      order: { id: 'DESC' },
    });

    const creditRows = await this.enrollments
      .createQueryBuilder('e')
      .innerJoin('e.section', 's')
      .innerJoin('s.course', 'c')
      .select('s.semester_id', 'semester_id')
      .addSelect('SUM(c.credit_hours)', 'credits')
      .where('e.student_id = :id', { id: studentId })
      .andWhere("e.status = 'approved'")
      .groupBy('s.semester_id')
      .getRawMany();
    const credits = new Map<number, number>(creditRows.map((r) => [Number(r.semester_id), Number(r.credits)]));

    const semIds = new Set<number>([...credits.keys(), ...payments.map((p) => p.semester_id)]);
    const sems = semIds.size ? await this.semesters.find({ where: { id: In([...semIds]) } }) : [];

    const semesters = sems
      .sort(
        (a, b) =>
          b.academic_year.localeCompare(a.academic_year) || TERM_ORDER.indexOf(b.term) - TERM_ORDER.indexOf(a.term),
      )
      .map((sem) => {
        const mine = payments.filter((p) => p.semester_id === sem.id);
        const total = (st: string) =>
          r2(mine.filter((p) => p.status === st).reduce((t, p) => t + Number(p.amount), 0));
        const paid = total('paid');
        const cr = credits.get(sem.id) ?? 0;
        const due = rate > 0 ? r2(cr * rate) : null;
        const balance = due === null ? null : r2(due - paid);
        return {
          semester_id: sem.id,
          academic_year: sem.academic_year,
          term: sem.term,
          credit_hours: cr,
          fee_due: due,
          paid,
          pending: total('pending'),
          refunded: total('refunded'),
          balance,
          status: balance === null ? null : balance <= 0 ? 'cleared' : 'balance_due',
        };
      });

    return {
      student: { id: student.id, student_no: student.student_no, full_name: student.user.full_name },
      fee_per_credit_hour: rate || null,
      semesters,
      payments: payments.map((p) => this.view(p)),
    };
  }
}
