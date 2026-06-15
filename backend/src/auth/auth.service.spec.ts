import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/role.enum';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({ compare: jest.fn() }));

describe('AuthService', () => {
  const user = {
    id: 1,
    name: 'Admin',
    email: 'admin@example.com',
    passwordHash: 'hash',
    role: Role.Admin,
    active: true,
  } as User;

  function setup(found: User | null = user) {
    const users = {
      findByEmailWithPassword: jest.fn().mockResolvedValue(found),
      create: jest.fn().mockResolvedValue(user),
    } as unknown as UsersService;
    const jwt = { sign: jest.fn().mockReturnValue('token') } as unknown as JwtService;
    return { service: new AuthService(users, jwt), users, jwt };
  }

  beforeEach(() => jest.mocked(bcrypt.compare).mockResolvedValue(true as never));

  it('issues a token for valid login credentials', async () => {
    const { service, jwt } = setup();

    await expect(service.login({ email: user.email, password: 'password' })).resolves.toEqual({
      accessToken: 'token',
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    expect(jwt.sign).toHaveBeenCalledWith({ sub: user.id, email: user.email, role: user.role });
  });

  it.each([
    ['missing user', null],
    ['inactive user', { ...user, active: false }],
  ])('rejects %s during login', async (_label, found) => {
    const { service } = setup(found as User | null);

    await expect(service.login({ email: user.email, password: 'password' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects incorrect passwords', async () => {
    jest.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const { service } = setup();

    await expect(service.login({ email: user.email, password: 'wrong' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('creates users during registration and returns a token', async () => {
    const { service, users } = setup();

    await expect(service.register({ name: user.name, email: user.email, password: 'password' }))
      .resolves.toEqual(expect.objectContaining({ accessToken: 'token' }));
    expect(users.create).toHaveBeenCalledWith(user.name, user.email, 'password');
  });
});
