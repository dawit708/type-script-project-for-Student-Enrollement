import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../../common/base/base-crud.service';
import { Program } from '../../database/entities/program.entity';

@Injectable()
export class ProgramsService extends BaseCrudService<Program> {
  constructor(@InjectRepository(Program) repo: Repository<Program>) {
    super(repo, { department: true });
  }
}
