import { DataSource } from 'typeorm';
import { CacheStore } from '../cache/cache-store';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  it('caches the assembled sales report', async () => {
    const query = jest.fn()
      .mockResolvedValueOnce([{ totalSales: '100.00' }])
      .mockResolvedValueOnce([{ date: '2026-06-15', total: '100.00' }])
      .mockResolvedValueOnce([{ month: '2026-06', total: '100.00' }])
      .mockResolvedValueOnce([{ id: 1, quantitySold: '2' }])
      .mockResolvedValueOnce([{ category: 'Coffee', revenue: '100.00' }]);
    const dataSource = { query } as unknown as DataSource;
    const cache = {
      remember: jest.fn((_key, load) => load()),
    } as unknown as CacheStore;

    const result = await new ReportsService(dataSource, cache).sales();

    expect(cache.remember).toHaveBeenCalledWith('reports:sales', expect.any(Function));
    expect(query).toHaveBeenCalledTimes(5);
    expect(result.summary).toEqual({ totalSales: '100.00' });
  });
});
