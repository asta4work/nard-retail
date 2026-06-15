import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../common/role.enum';
import { User } from './user.entity';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({ hash: jest.fn() }));

describe('UsersService', () => {
  const user = {
    id: 1,
    name: 'User',
    email: 'user@example.com',
    passwordHash: 'hash',
    role: Role.Employee,
    active: true,
  } as User;

  function setup() {
    const query = {
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(user),
    };
    const repository = {
      exists: jest.fn().mockResolvedValue(false),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ ...value, id: 1 })),
      findOneBy: jest.fn().mockResolvedValue({ ...user }),
      find: jest.fn().mockResolvedValue([user]),
      createQueryBuilder: jest.fn().mockReturnValue(query),
    } as unknown as Repository<User>;
    return { service: new UsersService(repository), repository, query };
  }

  beforeEach(() => jest.mocked(bcrypt.hash).mockResolvedValue('hashed' as never));

  it('creates normalized users and returns the saved record', async () => {
    const { service, repository } = setup();

    await service.create('User', 'USER@EXAMPLE.COM', 'password');

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      email: 'user@example.com',
      passwordHash: 'hashed',
      role: Role.Employee,
    }));
    expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('rejects duplicate users and missing records', async () => {
    const { service, repository } = setup();
    jest.mocked(repository.exists).mockResolvedValue(true);
    await expect(service.create('User', user.email, 'password')).rejects.toBeInstanceOf(ConflictException);

    jest.mocked(repository.findOneBy).mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('queries users by normalized email and lists newest first', async () => {
    const { service, repository, query } = setup();

    await service.findByEmailWithPassword('USER@EXAMPLE.COM');
    await service.findAll();

    expect(query.where).toHaveBeenCalledWith('user.email = :email', { email: 'user@example.com' });
    expect(repository.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
  });

  it('updates all supported user properties', async () => {
    const { service, repository } = setup();

    await service.update(1, {
      name: 'Updated',
      email: 'UPDATED@EXAMPLE.COM',
      role: Role.Admin,
      active: false,
      password: 'new-password',
    });

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Updated',
      email: 'updated@example.com',
      role: Role.Admin,
      active: false,
      passwordHash: 'hashed',
    }));
  });

  it('rejects duplicate email updates and only creates a missing admin', async () => {
    const { service, repository } = setup();
    jest.mocked(repository.exists).mockResolvedValueOnce(true);
    await expect(service.update(1, { email: 'other@example.com' })).rejects.toBeInstanceOf(ConflictException);

    jest.mocked(repository.exists).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await service.ensureAdmin('Admin', 'admin@example.com', 'password');
    await service.ensureAdmin('Admin', 'admin@example.com', 'password');

    expect(repository.create).toHaveBeenCalledTimes(1);
  });
});
