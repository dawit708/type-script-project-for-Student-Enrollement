import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Announcement } from '../../database/entities/announcement.entity';
import { Notification } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { Section } from '../../database/entities/section.entity';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { Student } from '../../database/entities/student.entity';
import { CreateAnnouncementDto } from './dto/create-announcements.dto';
import { UpdateAnnouncementDto } from './dto/update-announcements.dto';

type Me = { id: number; role: string };

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger('Announcements');

  constructor(
    @InjectRepository(Announcement) private repo: Repository<Announcement>,
    @InjectRepository(Notification) private notifications: Repository<Notification>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Section) private sections: Repository<Section>,
    @InjectRepository(Enrollment) private enrollments: Repository<Enrollment>,
    @InjectRepository(Teacher) private teachers: Repository<Teacher>,
    @InjectRepository(Student) private students: Repository<Student>,
  ) {}

  // sections the student is approved in, or the teacher teaches
  private async mySectionIds(user: Me): Promise<number[]> {
    if (user.role === 'student') {
      const st = await this.students.findOne({ where: { user_id: user.id } });
      if (!st) return [];
      const rows = await this.enrollments.find({
        where: { student_id: st.id, status: 'approved' },
        select: { section_id: true },
      });
      return rows.map((r) => r.section_id);
    }
    if (user.role === 'teacher') {
      const t = await this.teachers.findOne({ where: { user_id: user.id } });
      if (!t) return [];
      const rows = await this.sections.find({ where: { teacher_id: t.id }, select: { id: true } });
      return rows.map((r) => r.id);
    }
    return [];
  }

  private async withPosters(list: Announcement[]) {
    const ids = [...new Set(list.map((a) => a.posted_by))];
    const posters = ids.length ? await this.users.find({ where: { id: In(ids) }, relations: { role: true } }) : [];
    const map = new Map(posters.map((u) => [u.id, u]));
    return list.map((a) => ({
      ...a,
      posted_by_name: map.get(a.posted_by)?.full_name ?? null,
      posted_by_role: map.get(a.posted_by)?.role?.name ?? null,
    }));
  }

  async feed(user: Me) {
    let list: Announcement[];
    if (user.role === 'admin' || user.role === 'registrar') {
      list = await this.repo.find({ order: { id: 'DESC' }, take: 50 });
    } else {
      const ids = await this.mySectionIds(user);
      const sectionCond = ids.length
        ? '(a.section_id IS NULL OR a.section_id IN (:...ids))'
        : 'a.section_id IS NULL';
      list = await this.repo
        .createQueryBuilder('a')
        .where(`(a.posted_by = :uid OR (a.target_role IN ('all', :role) AND ${sectionCond}))`, {
          uid: user.id,
          role: user.role,
          ids,
        })
        .orderBy('a.id', 'DESC')
        .take(50)
        .getMany();
    }
    return this.withPosters(list);
  }

  async create(dto: CreateAnnouncementDto, user: Me) {
    let target = dto.target_role ?? 'all';
    const sectionId = dto.section_id ?? null;

    if (user.role === 'teacher') {
      if (!sectionId) throw new ForbiddenException('Teachers must choose one of their own sections (section_id)');
      const t = await this.teachers.findOne({ where: { user_id: user.id } });
      const sec = await this.sections.findOne({ where: { id: sectionId } });
      if (!sec) throw new NotFoundException('Section not found');
      if (!t || sec.teacher_id !== t.id) throw new ForbiddenException('This is not your section');
      target = 'student';
    } else if (sectionId && !(await this.sections.count({ where: { id: sectionId } }))) {
      throw new NotFoundException('Section not found');
    }

    const saved = await this.repo.save(
      this.repo.create({
        posted_by: user.id,
        title: dto.title,
        message: dto.message,
        target_role: target,
        section_id: sectionId as any,
      }),
    );

    // a notification problem must never block the announcement itself
    this.notifyRecipients(saved).catch((e) => this.logger.warn(`Notify failed: ${e.message}`));
    return saved;
  }

  private async recipients(a: Announcement): Promise<number[]> {
    const ids = new Set<number>();
    const wantStudents = ['all', 'student'].includes(a.target_role);
    const wantTeachers = ['all', 'teacher'].includes(a.target_role);

    if (a.section_id) {
      if (wantStudents) {
        const rows = await this.enrollments
          .createQueryBuilder('e')
          .innerJoin('e.student', 's')
          .select('s.user_id', 'user_id')
          .where('e.section_id = :sid', { sid: a.section_id })
          .andWhere("e.status = 'approved'")
          .getRawMany();
        rows.forEach((r) => ids.add(Number(r.user_id)));
      }
      if (wantTeachers) {
        const sec = await this.sections.findOne({ where: { id: a.section_id }, relations: { teacher: true } });
        if (sec?.teacher) ids.add(sec.teacher.user_id);
      }
    } else {
      const qb = this.users
        .createQueryBuilder('u')
        .innerJoin('u.role', 'r')
        .select('u.id', 'id')
        .where("u.status = 'active'");
      if (a.target_role !== 'all') qb.andWhere('r.name = :role', { role: a.target_role });
      (await qb.getRawMany()).forEach((r) => ids.add(Number(r.id)));
    }
    return [...ids];
  }

  private async notifyRecipients(a: Announcement) {
    const ids = (await this.recipients(a)).filter((id) => id !== a.posted_by);
    const message = `New announcement: ${a.title}`.slice(0, 480);
    for (let i = 0; i < ids.length; i += 500) {
      await this.notifications.insert(
        ids.slice(i, i + 500).map((user_id) => ({ user_id, title: 'New announcement', message })),
      );
    }
  }

  private async getOwned(id: number, user: Me) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException('Announcement not found');
    if (user.role !== 'admin' && a.posted_by !== user.id) {
      throw new ForbiddenException('You can only change your own announcements');
    }
    return a;
  }

  async update(id: number, dto: UpdateAnnouncementDto, user: Me) {
    const a = await this.getOwned(id, user);
    if (dto.title !== undefined) a.title = dto.title;
    if (dto.message !== undefined) a.message = dto.message;
    return this.repo.save(a);
  }

  async remove(id: number, user: Me) {
    await this.getOwned(id, user);
    await this.repo.delete(id);
    return { message: 'Deleted successfully' };
  }
}
