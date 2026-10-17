import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { User } from '../../database/entities/user.entity';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog) private repo: Repository<AuditLog>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  private redact(v: any, depth = 0): any {
    if (v === null || typeof v !== 'object') return v;
    if (depth > 4) return '[...]';
    if (Array.isArray(v)) return v.slice(0, 50).map((x) => this.redact(x, depth + 1));
    const out: any = {};
    for (const [k, val] of Object.entries(v)) {
      out[k] = /pass|token|secret|hash/i.test(k) ? '***' : this.redact(val, depth + 1);
    }
    return out;
  }

  // called by the interceptor after a successful write request
  async fromRequest(req: any, res: any) {
    const path: string = String(req.route?.path ?? req.path ?? '').replace(/^\/api\/v\d+/, '');
    const isLogin = path === '/auth/login';
    const userId = isLogin ? res?.user?.id : req.user?.id;
    if (!userId) return;

    const segment = path.split('/').filter(Boolean)[0] ?? '';
    const paramId = Number(req.params?.id);
    const resId = Number(res?.id);
    const recordId =
      Number.isInteger(paramId) && paramId > 0 ? paramId : Number.isInteger(resId) && resId > 0 ? resId : null;

    await this.repo.insert({
      user_id: userId,
      action: isLogin ? 'LOGIN' : `${req.method} ${path}`.slice(0, 50),
      table_name: segment.replace(/-/g, '_') || null,
      record_id: recordId,
      new_value: isLogin ? null : this.redact(req.body),
      ip_address: String(req.ip ?? '').slice(0, 45) || null,
    } as any);
  }

  async list(q: {
    user_id?: number;
    action?: string;
    table_name?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }) {
    if ((q.from && !DATE_RE.test(q.from)) || (q.to && !DATE_RE.test(q.to))) {
      throw new BadRequestException('from and to must be YYYY-MM-DD');
    }

    const qb = this.repo.createQueryBuilder('a').orderBy('a.id', 'DESC');
    if (q.user_id) qb.andWhere('a.user_id = :uid', { uid: q.user_id });
    if (q.action) qb.andWhere('a.action LIKE :act', { act: `%${q.action}%` });
    if (q.table_name) qb.andWhere('a.table_name = :t', { t: q.table_name });
    if (q.from) qb.andWhere('a.created_at >= :from', { from: `${q.from} 00:00:00` });
    if (q.to) qb.andWhere('a.created_at <= :to', { to: `${q.to} 23:59:59` });

    const [rows, total] = await qb
      .skip((q.page - 1) * q.limit)
      .take(q.limit)
      .getManyAndCount();

    const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))];
    const people = ids.length ? await this.users.find({ where: { id: In(ids) } }) : [];
    const names = new Map(people.map((u) => [u.id, u.full_name]));

    return {
      data: rows.map((r) => ({ ...r, user_name: names.get(r.user_id) ?? null })),
      meta: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) },
    };
  }
}
