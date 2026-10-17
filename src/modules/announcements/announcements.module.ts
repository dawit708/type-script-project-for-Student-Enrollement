import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Announcement } from '../../database/entities/announcement.entity';
import { Notification } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import { Section } from '../../database/entities/section.entity';
import { Enrollment } from '../../database/entities/enrollment.entity';
import { Teacher } from '../../database/entities/teacher.entity';
import { Student } from '../../database/entities/student.entity';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

@Module({
  imports: [TypeOrmModule.forFeature([Announcement, Notification, User, Section, Enrollment, Teacher, Student])],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
