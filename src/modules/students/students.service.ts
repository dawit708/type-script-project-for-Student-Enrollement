import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Student } from '../../database/entities/student.entity';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { CreateStudentDto } from './dto/create-students.dto';
import { UpdateStudentDto } from './dto/update-students.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student) private repo: Repository<Student>,
    private dataSource: DataSource,
  ) {}

  private strip(s: Student) {
    if (s.user) delete (s.user as any).password_hash;
    return s;
  }

  async findAll(filters: { program_id?: number; status?: string }) {
    const where: any = {};
    if (filters.program_id) where.program_id = filters.program_id;
    if (filters.status) where.status = filters.status;
    const list = await this.repo.find({ where, relations: { user: true, program: true }, order: { id: 'DESC' } });
    return list.map((s) => this.strip(s));
  }

  async findOne(id: number) {
    const s = await this.repo.findOne({ where: { id }, relations: { user: true, program: true } });
    if (!s) throw new NotFoundException('Student not found');
    return this.strip(s);
  }

  async findByUser(userId: number) {
    const s = await this.repo.findOne({ where: { user_id: userId }, relations: { user: true, program: true } });
    if (!s) throw new NotFoundException('Student profile not found');
    return this.strip(s);
  }

  async create(dto: CreateStudentDto) {
    try {
      const id = await this.dataSource.transaction(async (m) => {
        const role = await m.findOne(Role, { where: { name: 'student' } });
        if (!role) throw new BadRequestException('Role "student" is missing in the roles table');
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

        const student_no =
          dto.student_no || `STU${new Date().getFullYear()}${String(user.id).padStart(4, '0')}`;

        const student = await m.save(
          m.create(Student, {
            user_id: user.id,
            program_id: dto.program_id,
            student_no,
            gender: dto.gender,
            date_of_birth: dto.date_of_birth,
            address: dto.address,
            guardian_name: dto.guardian_name,
            guardian_phone: dto.guardian_phone,
            admission_date: dto.admission_date,
            current_year: dto.current_year,
            current_semester: dto.current_semester,
          }),
        );
        return student.id;
      });
      return this.findOne(id);
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') throw new ConflictException('Student number already exists');
      if (e.code === 'ER_NO_REFERENCED_ROW_2') throw new BadRequestException('Program does not exist');
      throw e;
    }
  }

  async update(id: number, dto: UpdateStudentDto) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Student not found');

    const { full_name, phone, ...studentFields } = dto;

    const userPatch: any = {};
    if (full_name !== undefined) userPatch.full_name = full_name;
    if (phone !== undefined) userPatch.phone = phone;
    if (Object.keys(userPatch).length) await this.dataSource.getRepository(User).update(s.user_id, userPatch);

    const patch: any = {};
    Object.entries(studentFields).forEach(([k, v]) => {
      if (v !== undefined) patch[k] = v;
    });
    try {
      if (Object.keys(patch).length) await this.repo.update(id, patch);
    } catch (e: any) {
      if (e.code === 'ER_NO_REFERENCED_ROW_2') throw new BadRequestException('Program does not exist');
      throw e;
    }
    return this.findOne(id);
  }
}
