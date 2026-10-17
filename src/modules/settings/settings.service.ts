import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../../database/entities/setting.entity';
import { SaveSettingDto } from './dto/create-settings.dto';

const NUMERIC = ['pass_mark', 'max_credit_per_semester', 'min_credit_per_semester', 'fee_per_credit_hour'];

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Setting) private repo: Repository<Setting>) {}

  findAll() {
    return this.repo.find({ order: { setting_key: 'ASC' } });
  }

  async findOne(key: string) {
    const s = await this.repo.findOne({ where: { setting_key: key } });
    if (!s) throw new NotFoundException('Setting not found');
    return s;
  }

  // creates the setting if it does not exist, otherwise updates it
  async save(key: string, dto: SaveSettingDto) {
    if (!/^[a-z0-9_]{2,80}$/.test(key)) {
      throw new BadRequestException('Key must be 2-80 characters: lowercase letters, numbers, underscore');
    }
    if (NUMERIC.includes(key)) {
      const n = Number(dto.setting_value);
      if (dto.setting_value.trim() === '' || !Number.isFinite(n) || n < 0) {
        throw new BadRequestException(`${key} must be a number (0 or more)`);
      }
    }
    let s = await this.repo.findOne({ where: { setting_key: key } });
    if (!s) s = this.repo.create({ setting_key: key });
    s.setting_value = dto.setting_value;
    if (dto.description !== undefined) s.description = dto.description;
    return this.repo.save(s);
  }
}
