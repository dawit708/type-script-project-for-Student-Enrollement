import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { CoursesModule } from './modules/courses/courses.module';
import { SemestersModule } from './modules/semesters/semesters.module';
import { SectionsModule } from './modules/sections/sections.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { GradesModule } from './modules/grades/grades.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: databaseConfig,
    }),
    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    DepartmentsModule,
    ProgramsModule,
    CoursesModule,
    SemestersModule,
    SectionsModule,
    EnrollmentsModule,
    GradesModule,
    AttendanceModule,
    NotificationsModule,
    AnnouncementsModule,
    PaymentsModule,
    ReportsModule,
    SettingsModule,
    AuditLogsModule,
    HealthModule,
  ],
})
export class AppModule {}
