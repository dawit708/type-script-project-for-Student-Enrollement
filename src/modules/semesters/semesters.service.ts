import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../../common/base/base-crud.service';
import { Semester } from '../../database/entities/semester.entity';

@Injectable()
export class SemestersService extends BaseCrudService<Semester> {
  constructor(@InjectRepository(Semester) private semRepo: Repository<Semester>) {
    super(semRepo);
  }

  async findCurrent() {
    const sem = await this.semRepo.findOne({ where: { is_current: true } });
    if (!sem) throw new NotFoundException('No current semester is set');
    return sem;
  }

  async setEnrollment(id: number, open: boolean) {
    const sem = await this.findOne(id);
    sem.is_enrollment_open = open;
    return this.semRepo.save(sem);
  }
}
