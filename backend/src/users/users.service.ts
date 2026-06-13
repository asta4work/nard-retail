import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../common/role.enum';
import { User } from './user.entity';
import { UpdateUserDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async create(name: string, email: string, password: string, role = Role.Employee) {
    if (await this.users.exists({ where: { email: email.toLowerCase() } })) {
      throw new ConflictException('Email is already registered');
    }
    const saved = await this.users.save(this.users.create({
      name,
      email: email.toLowerCase(),
      passwordHash: await bcrypt.hash(password, 12),
      role,
    }));
    return this.findOne(saved.id);
  }

  findByEmailWithPassword(email: string) {
    return this.users.createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async findOne(id: number) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  findAll() {
    return this.users.find({ order: { createdAt: 'DESC' } });
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (dto.email && dto.email.toLowerCase() !== user.email &&
      await this.users.exists({ where: { email: dto.email.toLowerCase() } })) {
      throw new ConflictException('Email is already registered');
    }
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email.toLowerCase();
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.active !== undefined) user.active = dto.active;
    if (dto.password) user.passwordHash = await bcrypt.hash(dto.password, 12);
    await this.users.save(user);
    return this.findOne(user.id);
  }

  async ensureAdmin(name: string, email: string, password: string) {
    if (await this.users.exists({ where: { email: email.toLowerCase() } })) return;
    await this.create(name, email, password, Role.Admin);
  }
}
