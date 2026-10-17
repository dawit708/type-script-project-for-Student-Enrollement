import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email }, relations: { role: true } });
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid email or password');
    }
    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Invalid email or password');

    await this.users.update(user.id, { last_login: new Date() });

    const payload = { sub: user.id, email: user.email, role: user.role.name };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: user.id, name: user.full_name, email: user.email, role: user.role.name },
    };
  }

  async me(userId: number) {
    const user = await this.users.findOne({ where: { id: userId }, relations: { role: true } });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, name: user.full_name, email: user.email, phone: user.phone, role: user.role.name };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const ok = await bcrypt.compare(dto.current_password, user.password_hash);
    if (!ok) throw new BadRequestException('Current password is wrong');
    user.password_hash = await bcrypt.hash(dto.new_password, 10);
    await this.users.save(user);
    return { message: 'Password changed successfully' };
  }
}
