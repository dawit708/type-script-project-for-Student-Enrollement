import { Controller, Delete, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get()
  list(@CurrentUser() u: { id: number }, @Query('unread') unread?: string, @Query('limit') limit?: string) {
    return this.service.list(u.id, unread === 'true', Math.min(100, Math.max(1, Number(limit) || 50)));
  }

  @Get('unread-count')
  count(@CurrentUser() u: { id: number }) {
    return this.service.unreadCount(u.id);
  }

  @Patch('read-all')
  readAll(@CurrentUser() u: { id: number }) {
    return this.service.markAllRead(u.id);
  }

  @Patch(':id/read')
  read(@CurrentUser() u: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.service.markRead(u.id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() u: { id: number }, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(u.id, id);
  }
}
