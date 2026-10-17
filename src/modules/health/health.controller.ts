import { Controller, Get, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const TABLES = [
  'roles', 'users', 'students', 'teachers', 'departments', 'programs',
  'semesters', 'courses', 'course_prerequisites', 'sections', 'enrollments',
  'grades', 'attendance', 'payments', 'announcements', 'notifications',
  'audit_logs', 'settings',
];

@Controller('health')
export class HealthController {
  constructor(private ds: DataSource) {}

  // public: open it in the browser
  @Get()
  async check() {
    try {
      await this.ds.query('SELECT 1');
      return { status: 'ok', database: 'connected', time: new Date().toISOString() };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'disconnected' });
    }
  }

  // admin only: database name, MySQL version, the 18 tables and their row counts
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('tables')
  async tables() {
    const [info] = await this.ds.query('SELECT DATABASE() AS db, VERSION() AS version');
    const found: { name: string }[] = await this.ds.query(
      'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()',
    );
    const names = new Set(found.map((r) => r.name));

    const tables: { table: string; exists: boolean; rows: number | null }[] = [];
    for (const t of TABLES) {
      if (!names.has(t)) {
        tables.push({ table: t, exists: false, rows: null });
        continue;
      }
      const [r] = await this.ds.query(`SELECT COUNT(*) AS c FROM \`${t}\``);
      tables.push({ table: t, exists: true, rows: Number(r.c) });
    }
    const missing = tables.filter((t) => !t.exists).map((t) => t.table);

    return {
      status: missing.length ? 'incomplete' : 'ok',
      database: info.db,
      mysql_version: info.version,
      expected_tables: TABLES.length,
      found_tables: TABLES.length - missing.length,
      missing,
      tables,
    };
  }
}
