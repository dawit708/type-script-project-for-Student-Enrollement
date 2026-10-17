import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../../common/base/base-crud.service';
import { Department } from '../../database/entities/department.entity';

@Injectable()
export class DepartmentsService extends BaseCrudService<Department> {
  constructor(@InjectRepository(Department) repo: Repository<Department>) {
    super(repo);
  }
}
