import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Page, Product, ProductInput } from '@app/models';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const product: Product = {
    id: 1,
    name: 'Coffee',
    description: null,
    price: '10.00',
    stockQuantity: 5,
    category: 'Drinks',
    icon: 'coffee',
    createdAt: '',
    updatedAt: '',
  };
  const page: Page<Product> = {
    data: [product],
    meta: { page: 1, limit: 10, total: 1, pages: 1 },
  };
  let http: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    http = {
      get: vi.fn((url: string) => {
        if (url.endsWith('/categories')) return of(['Drinks']);
        if (url.endsWith('/1')) return of(product);
        return of(page);
      }),
      post: vi.fn(() => of(product)),
      patch: vi.fn(() => of(product)),
      delete: vi.fn(() => of(undefined)),
    };
  });

  it('caches list, category, and individual product reads', async () => {
    const service = new ProductsService(http as unknown as HttpClient);

    await firstValueFrom(service.list({ page: 1 }));
    await firstValueFrom(service.list({ page: 1 }));
    await firstValueFrom(service.categories());
    await firstValueFrom(service.categories());
    await firstValueFrom(service.get(1));
    await firstValueFrom(service.get(1));

    expect(http.get).toHaveBeenCalledTimes(3);
  });

  it('applies stock updates and refreshes cached pages', async () => {
    const service = new ProductsService(http as unknown as HttpClient);
    const emissions: Page<Product>[] = [];
    const subscription = service.list({ page: 1 }).subscribe((value) => emissions.push(value));

    service.applyStockUpdates([{ productId: 1, stockQuantity: 2 }]);
    service.refreshCachedPages();

    expect(emissions.at(-1)?.data[0].stockQuantity).toBe(5);
    expect(emissions.some((value) => value.data[0].stockQuantity === 2)).toBe(true);
    expect(http.get).toHaveBeenCalledTimes(2);
    subscription.unsubscribe();
  });

  it('clears caches after product writes', async () => {
    const service = new ProductsService(http as unknown as HttpClient);
    const input = { name: 'Coffee' } as ProductInput;
    await firstValueFrom(service.list({ page: 1 }));

    await firstValueFrom(service.create(input));
    await firstValueFrom(service.update(1, input));
    await firstValueFrom(service.remove(1));
    await firstValueFrom(service.list({ page: 1 }));

    expect(http.post).toHaveBeenCalled();
    expect(http.patch).toHaveBeenCalled();
    expect(http.delete).toHaveBeenCalled();
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it('evicts failed page requests so they can be retried', async () => {
    http.get.mockReturnValueOnce(throwError(() => new Error('failed'))).mockReturnValueOnce(of(page));
    const service = new ProductsService(http as unknown as HttpClient);

    await expect(firstValueFrom(service.list({ page: 1 }))).rejects.toThrow('failed');
    await expect(firstValueFrom(service.list({ page: 1 }))).resolves.toEqual(page);
    expect(http.get).toHaveBeenCalledTimes(2);
  });
});
