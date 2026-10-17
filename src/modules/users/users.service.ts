import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { Role } from '../../database/entities/role.entity';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Role) private roles: Repository<Role>,
  ) {}

  private clean(u: User) {
    const { password_hash, ...rest } = u;
    return rest;
  }

  async findAll(role?: string) {
    const where: any = role ? { role: { name: role } } : {};
    const list = await this.users.find({ where, relations: { role: true }, order: { id: 'DESC' } });
    return list.map((u) => this.clean(u));
  }

  async findOne(id: number) {
    const u = await this.users.findOne({ where: { id }, relations: { role: true } });
    if (!u) throw new NotFoundException('User not found');
    return this.clean(u);
  }

  async create(dto: CreateUserDto) {
    const role = await this.roles.findOne({ where: { name: dto.role } });
    if (!role) throw new BadRequestException('Invalid role');
    const exists = await this.users.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already used');

    const saved = await this.users.save(
      this.users.create({
        role_id: role.id,
        full_name: dto.full_name,
        email: dto.email,
        phone: dto.phone,
        password_hash: await bcrypt.hash(dto.password, 10),
      }),
    );
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateUserDto, currentUserId: number) {
    await this.findOne(id);
    if (dto.status === 'disabled' && id === currentUserId) {
      throw new BadRequestException('You cannot disable your own account');
    }
    const patch: any = {};
    if (dto.full_name !== undefined) patch.full_name = dto.full_name;
    if (dto.phone !== undefined) patch.phone = dto.phone;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.password) patch.password_hash = await bcrypt.hash(dto.password, 10);
    if (Object.keys(patch).length) await this.users.update(id, patch);
    return this.findOne(id);
  }

  async disable(id: number, currentUserId: number) {
    await this.update(id, { status: 'disabled' }, currentUserId);
    return { message: 'User disabled' };
  }
}
