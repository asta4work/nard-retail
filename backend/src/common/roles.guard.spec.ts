import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const context = (role?: Role) => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
  }) as unknown as ExecutionContext;

  it('allows routes without role metadata', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context())).toBe(true);
  });

  it('allows matching roles and rejects other roles', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue([Role.Admin]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(context(Role.Admin))).toBe(true);
    expect(guard.canActivate(context(Role.Employee))).toBe(false);
  });
});
