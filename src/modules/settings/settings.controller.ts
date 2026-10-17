import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SaveSettingDto } from './dto/create-settings.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get() findAll() { return this.service.findAll(); }

  @Get(':key') findOne(@Param('key') key: string) { return this.service.findOne(key); }

  @Put(':key') save(@Param('key') key: string, @Body() dto: SaveSettingDto) { return this.service.save(key, dto); }
}
