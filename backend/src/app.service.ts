import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users/users.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(private readonly config: ConfigService, private readonly users: UsersService) {}

  async onApplicationBootstrap() {
    await this.users.ensureAdmin(
      this.config.get('ADMIN_NAME', 'System Admin'),
      this.config.get('ADMIN_EMAIL', 'admin@retail.local'),
      this.config.get('ADMIN_PASSWORD', 'ChangeMe123!'),
    );
  }

  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
