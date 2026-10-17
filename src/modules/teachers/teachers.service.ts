import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Teacher } from '../../database/entities/teacher.entity';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { CreateTeacherDto } from './dto/create-teachers.dto';
import { UpdateTeacherDto } from './dto/update-teachers.dto';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(Teacher) private repo: Repository<Teacher>,
    private dataSource: DataSource,
  ) {}

  private strip(t: Teacher) {
    if (t.user) delete (t.user as any).password_hash;
    return t;
  }

  async findAll(department_id?: number) {
    const where: any = department_id ? { department_id } : {};
    const list = await this.repo.find({ where, relations: { user: true, department: true }, order: { id: 'DESC' } });
    return list.map((t) => this.strip(t));
  }

  async findOne(id: number) {
    const t = await this.repo.findOne({ where: { id }, relations: { user: true, department: true } });
    if (!t) throw new NotFoundException('Teacher not found');
    return this.strip(t);
  }

  async findByUser(userId: number) {
    const t = await this.repo.findOne({ where: { user_id: userId }, relations: { user: true, department: true } });
    if (!t) throw new NotFoundException('Teacher profile not found');
    return this.strip(t);
  }

  async create(dto: CreateTeacherDto) {
    try {
      const id = await this.dataSource.transaction(async (m) => {
        const role = await m.findOne(Role, { where: { name: 'teacher' } });
        if (!role) throw new BadRequestException('Role "teacher" is missing in the roles table');
        if (await m.findOne(User, { where: { email: dto.email } })) {
          throw new ConflictException('Email already used');
        }

        const user = await m.save(
          m.create(User, {
            role_id: role.id,
            full_name: dto.full_name,
            email: dto.email,
            phone: dto.phone,
            password_hash: await bcrypt.hash(dto.password, 10),
          }),
        );

        const employee_no =
          dto.employee_no || `TCH${new Date().getFullYear()}${String(user.id).padStart(4, '0')}`;

        const teacher = await m.save(
          m.create(Teacher, {
            user_id: user.id,
            department_id: dto.department_id,
            employee_no,
            qualification: dto.qualification,
            hire_date: dto.hire_date,
          }),
        );
        return teacher.id;
      });
      return this.findOne(id);
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') throw new ConflictException('Employee number already exists');
      if (e.code === 'ER_NO_REFERENCED_ROW_2') throw new BadRequestException('Department does not exist');
      throw e;
    }
  }

  async update(id: number, dto: UpdateTeacherDto) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException('Teacher not found');

    const { full_name, phone, ...teacherFields } = dto;

    const userPatch: any = {};
    if (full_name !== undefined) userPatch.full_name = full_name;
    if (phone !== undefined) userPatch.phone = phone;
    if (Object.keys(userPatch).length) await this.dataSource.getRepository(User).update(t.user_id, userPatch);

    const patch: any = {};
    Object.entries(teacherFields).forEach(([k, v]) => {
      if (v !== undefined) patch[k] = v;
    });
    try {
      if (Object.keys(patch).length) await this.repo.update(id, patch);
    } catch (e: any) {
      if (e.code === 'ER_NO_REFERENCED_ROW_2') throw new BadRequestException('Department does not exist');
      throw e;
    }
    return this.findOne(id);
  }
}
