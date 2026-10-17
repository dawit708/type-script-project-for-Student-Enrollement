import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcements.dto';
import { UpdateAnnouncementDto } from './dto/update-announcements.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

type Me = { id: number; role: string };

@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementsController {
  constructor(private service: AnnouncementsService) {}

  // every role: announcements meant for me
  @Get()
  feed(@CurrentUser() user: Me) {
    return this.service.feed(user);
  }

  @Roles('admin', 'registrar', 'teacher')
  @Post()
  create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: Me) {
    return this.service.create(dto, user);
  }

  @Roles('admin', 'registrar', 'teacher')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAnnouncementDto, @CurrentUser() user: Me) {
    return this.service.update(id, dto, user);
  }

  @Roles('admin', 'registrar', 'teacher')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Me) {
    return this.service.remove(id, user);
  }
}
