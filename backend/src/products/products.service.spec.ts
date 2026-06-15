import { Repository } from 'typeorm';
import { CacheStore } from '../cache/cache-store';
import { InventoryGateway } from '../realtime/inventory.gateway';
import { Product } from './product.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const product = { id: 1, name: 'Coffee', price: '10.00', stockQuantity: 5 } as Product;

  function setup() {
    const products = {
      findOneBy: jest.fn().mockResolvedValue({ ...product }),
      save: jest.fn(async (value) => value),
    } as unknown as Repository<Product>;
    const gateway = { broadcastProductChange: jest.fn() } as unknown as InventoryGateway;
    const cache = {
      invalidate: jest.fn(),
      key: jest.fn((scope, value) => `${scope}:${value}`),
      remember: jest.fn((_key, load) => load()),
    } as unknown as CacheStore;
    return { service: new ProductsService(products, gateway, cache), products, gateway, cache };
  }

  it('uses the cache for product reads', async () => {
    const { service, cache, products } = setup();

    await service.findOne(1);

    expect(cache.remember).toHaveBeenCalledWith('products:item:1', expect.any(Function));
    expect(products.findOneBy).toHaveBeenCalledWith({ id: 1 });
  });

  it('loads a fresh entity and invalidates caches for writes', async () => {
    const { service, cache, products, gateway } = setup();

    await service.update(1, { name: 'Fresh Coffee' });

    expect(cache.remember).not.toHaveBeenCalled();
    expect(products.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Fresh Coffee' }));
    expect(cache.invalidate).toHaveBeenCalledWith('products:', 'reports:');
    expect(gateway.broadcastProductChange).toHaveBeenCalledWith({ action: 'updated', productId: 1 });
  });
});
