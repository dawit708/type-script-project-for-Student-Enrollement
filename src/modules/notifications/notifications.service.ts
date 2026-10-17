import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(Notification) private repo: Repository<Notification>) {}

  list(userId: number, unreadOnly: boolean, limit: number) {
    return this.repo.find({
      where: { user_id: userId, ...(unreadOnly ? { is_read: false } : {}) },
      order: { id: 'DESC' },
      take: limit,
    });
  }

  async unreadCount(userId: number) {
    return { unread: await this.repo.count({ where: { user_id: userId, is_read: false } }) };
  }

  async markRead(userId: number, id: number) {
    const n = await this.repo.findOne({ where: { id, user_id: userId } });
    if (!n) throw new NotFoundException('Notification not found');
    if (!n.is_read) {
      n.is_read = true;
      await this.repo.save(n);
    }
    return n;
  }

  async markAllRead(userId: number) {
    const r = await this.repo.update({ user_id: userId, is_read: false }, { is_read: true });
    return { updated: r.affected ?? 0 };
  }

  async remove(userId: number, id: number) {
    const r = await this.repo.delete({ id, user_id: userId });
    if (!r.affected) throw new NotFoundException('Notification not found');
    return { message: 'Deleted successfully' };
  }
}
