import { ConfigService } from '@nestjs/config';
import { UsersService } from './users/users.service';
import { AppService } from './app.service';

describe('AppService', () => {
  function setup() {
    const config = {
      get: jest.fn((_key: string, fallback: string) => fallback),
    } as unknown as ConfigService;
    const users = { ensureAdmin: jest.fn() } as unknown as UsersService;
    return { service: new AppService(config, users), users };
  }

  it('reports service health', () => {
    expect(setup().service.health()).toEqual(expect.objectContaining({ status: 'ok' }));
  });

  it('ensures the configured admin exists during bootstrap', async () => {
    const { service, users } = setup();

    await service.onApplicationBootstrap();

    expect(users.ensureAdmin).toHaveBeenCalledWith('System Admin', 'admin@retail.local', 'ChangeMe123!');
  });
});
