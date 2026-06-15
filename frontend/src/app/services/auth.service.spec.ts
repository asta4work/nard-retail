import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthResponse } from '@app/models';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user = { id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin' as const };
  const response: AuthResponse = { accessToken: 'token-123', user };
  let values: Map<string, string>;
  let http: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    values = new Map();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => values.set(key, value)),
      removeItem: vi.fn((key: string) => values.delete(key)),
    });
    http = { post: vi.fn(() => of(response)) };
  });

  it('stores login results and exposes authentication state', async () => {
    const service = new AuthService(http as unknown as HttpClient);

    await firstValueFrom(service.login({ email: user.email, password: 'password' }));

    expect(http.post).toHaveBeenCalledWith('/api/auth/login', { email: user.email, password: 'password' });
    expect(service.token).toBe('token-123');
    expect(service.user).toEqual(user);
    expect(service.authenticated).toBe(true);
    expect(service.isAdmin).toBe(true);
  });

  it('registers users and clears authentication on logout', async () => {
    const service = new AuthService(http as unknown as HttpClient);

    await firstValueFrom(service.register({ name: user.name, email: user.email, password: 'password' }));
    service.logout();

    expect(http.post).toHaveBeenCalledWith('/api/auth/register', {
      name: user.name,
      email: user.email,
      password: 'password',
    });
    expect(service.authenticated).toBe(false);
    expect(service.user).toBeNull();
  });

  it('restores valid stored users and ignores invalid JSON', () => {
    values.set('user', JSON.stringify(user));
    expect(new AuthService(http as unknown as HttpClient).user).toEqual(user);

    values.set('user', '{invalid');
    expect(new AuthService(http as unknown as HttpClient).user).toBeNull();
  });
});
