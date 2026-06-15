import { Repository } from 'typeorm';
import { CacheStore } from '../cache/cache-store';
import { InventoryGateway } from '../realtime/inventory.gateway';
import { Product } from './product.entity';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const product = { id: 1, name: 'Coffee', price: '10.00', stockQuantity: 5 } as Product;

  function setup() {
    const queryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[product], 1]),
      select: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ category: 'Drinks' }]),
    };
    const products = {
      create: jest.fn((value) => value),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOneBy: jest.fn().mockResolvedValue({ ...product }),
      save: jest.fn(async (value) => ({ ...value, id: value.id ?? 2 })),
      remove: jest.fn(),
    } as unknown as Repository<Product>;
    const gateway = { broadcastProductChange: jest.fn() } as unknown as InventoryGateway;
    const cache = {
      invalidate: jest.fn(),
      key: jest.fn((scope, value) => `${scope}:${value}`),
      remember: jest.fn((_key, load) => load()),
    } as unknown as CacheStore;
    return { service: new ProductsService(products, gateway, cache), products, gateway, cache, queryBuilder };
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

  it('creates and removes products while broadcasting changes', async () => {
    const { service, products, gateway } = setup();

    await service.create({
      name: 'Tea',
      price: 4.5,
      stockQuantity: 3,
      category: 'Drinks',
      icon: 'coffee',
    });
    await service.remove(1);

    expect(products.create).toHaveBeenCalledWith(expect.objectContaining({ price: '4.50' }));
    expect(products.remove).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    expect(gateway.broadcastProductChange).toHaveBeenCalledWith({ action: 'created', productId: 2 });
    expect(gateway.broadcastProductChange).toHaveBeenCalledWith({ action: 'deleted', productId: 1 });
  });

  it('applies catalog filters and builds paginated results', async () => {
    const { service, queryBuilder } = setup();

    const result = await service.findAll({
      search: 'coffee +fresh',
      category: 'Drinks',
      minPrice: 1,
      maxPrice: 20,
      availability: 'low-stock',
      sort: 'price',
      order: 'asc',
      page: 2,
      limit: 10,
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledTimes(5);
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('product.price', 'ASC');
    expect(queryBuilder.skip).toHaveBeenCalledWith(10);
    expect(result.meta).toEqual({ total: 1, page: 2, limit: 10, pages: 1 });
  });

  it('returns sorted categories and rejects missing products', async () => {
    const { service, products, queryBuilder } = setup();

    await expect(service.categories()).resolves.toEqual(['Drinks']);
    expect(queryBuilder.distinct).toHaveBeenCalledWith(true);

    jest.mocked(products.findOneBy).mockResolvedValue(null);
    await expect(service.update(99, { name: 'Missing' })).rejects.toThrow('Product not found');
  });
});
