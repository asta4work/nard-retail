import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { CartItem, InventoryReport, Sale, SalesReport, User } from '@app/models';
import { ReportsService } from './reports.service';
import { SalesService } from './sales.service';
import { UsersService } from './users.service';

describe('API data services', () => {
  it('caches reports until invalidated', async () => {
    const sales = { summary: {} } as SalesReport;
    const inventory = { summary: {} } as InventoryReport;
    const http = { get: vi.fn((url: string) => of(url.includes('/sales') ? sales : inventory)) };
    const service = new ReportsService(http as unknown as HttpClient);

    await firstValueFrom(service.load());
    await firstValueFrom(service.load());
    expect(http.get).toHaveBeenCalledTimes(2);

    service.invalidate();
    await firstValueFrom(service.load());
    expect(http.get).toHaveBeenCalledTimes(4);
  });

  it('maps checkout items and invalidates report data', async () => {
    const sale = { id: 1 } as Sale;
    const http = { post: vi.fn(() => of(sale)), get: vi.fn(() => of({ data: [] })) };
    const reports = { invalidate: vi.fn() };
    const service = new SalesService(http as unknown as HttpClient, reports as unknown as ReportsService);
    const items = [{ product: { id: 5 }, quantity: 2 }] as CartItem[];

    await firstValueFrom(service.checkout('', items));
    await firstValueFrom(service.list({ page: 2 }));

    expect(http.post).toHaveBeenCalledWith('/api/sales', {
      customerName: undefined,
      items: [{ productId: 5, quantity: 2 }],
    });
    expect(reports.invalidate).toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledWith('/api/sales', { params: expect.anything() });
  });

  it('caches users and invalidates after writes', async () => {
    const user = { id: 1, name: 'Admin' } as User;
    const http = {
      get: vi.fn(() => of([user])),
      post: vi.fn(() => of(user)),
      patch: vi.fn(() => of(user)),
    };
    const service = new UsersService(http as unknown as HttpClient);

    await firstValueFrom(service.list());
    await firstValueFrom(service.list());
    expect(http.get).toHaveBeenCalledTimes(1);

    await firstValueFrom(service.create({ name: 'User', email: 'user@example.com', password: 'password', role: 'employee' }));
    await firstValueFrom(service.list());
    await firstValueFrom(service.update(1, { active: false }));
    await firstValueFrom(service.list());

    expect(http.post).toHaveBeenCalled();
    expect(http.patch).toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledTimes(3);
  });
});
