import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '../common/role.enum';
import { Product } from '../products/product.entity';
import { InventoryGateway } from '../realtime/inventory.gateway';
import { User } from '../users/user.entity';
import { Sale } from './sale.entity';
import { SalesService } from './sales.service';
import { CacheStore } from '../cache/cache-store';

describe('SalesService', () => {
  const user = { id: 1, role: Role.Employee } as User;
  const product = (stockQuantity: number) => ({ id: 5, name: 'Coffee', price: '10.00', stockQuantity }) as Product;

  function setup(stockQuantity: number) {
    const gateway = { broadcastStock: jest.fn() } as unknown as InventoryGateway;
    const manager = {
      createQueryBuilder: jest.fn().mockReturnValue({
        setLock: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([product(stockQuantity)]),
      }),
      create: jest.fn((_type, value) => value),
      save: jest.fn(async (value) => Array.isArray(value) ? value : { ...value, id: 22 }),
    };
    const salesQuery = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: 22 }], 1]),
    };
    const salesRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 22 }),
      createQueryBuilder: jest.fn().mockReturnValue(salesQuery),
    };
    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
      getRepository: jest.fn().mockReturnValue(salesRepository),
    } as unknown as DataSource;
    const cache = {
      invalidate: jest.fn(),
      key: jest.fn((scope, value) => `${scope}:${value}`),
      remember: jest.fn((_key, load) => load()),
    } as unknown as CacheStore;
    return { service: new SalesService(dataSource, gateway, cache), gateway, manager, cache, salesRepository, salesQuery };
  }

  it('decrements stock and broadcasts only after a successful checkout', async () => {
    const { service, gateway, manager, cache } = setup(4);

    await service.checkout({ items: [{ productId: 5, quantity: 2 }] }, user);

    expect(manager.save).toHaveBeenCalledWith([expect.objectContaining({ id: 5, stockQuantity: 2 })]);
    expect(cache.invalidate).toHaveBeenCalledWith('products:', 'reports:', 'sales:');
    expect(gateway.broadcastStock).toHaveBeenCalledWith([{ productId: 5, stockQuantity: 2 }]);
  });

  it('rejects overselling without broadcasting a stock update', async () => {
    const { service, gateway } = setup(1);

    await expect(service.checkout({ items: [{ productId: 5, quantity: 2 }] }, user)).rejects.toBeInstanceOf(BadRequestException);
    expect(gateway.broadcastStock).not.toHaveBeenCalled();
  });

  it('rejects checkout when products no longer exist', async () => {
    const { service, manager, gateway } = setup(4);
    manager.createQueryBuilder.mockReturnValue({
      setLock: jest.fn().mockReturnThis(),
      whereInIds: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    });

    await expect(service.checkout({ items: [{ productId: 5, quantity: 1 }] }, user))
      .rejects.toThrow('One or more products no longer exist');
    expect(gateway.broadcastStock).not.toHaveBeenCalled();
  });

  it('normalizes duplicate checkout items and customer names', async () => {
    const { service, manager } = setup(4);

    await service.checkout({
      customerName: '  Customer  ',
      items: [{ productId: 5, quantity: 1 }, { productId: 5, quantity: 2 }],
    }, user);

    expect(manager.save).toHaveBeenCalledWith([expect.objectContaining({ stockQuantity: 1 })]);
    expect(manager.create).toHaveBeenCalledWith(Sale, expect.objectContaining({
      customerName: 'Customer',
      totalAmount: '30.00',
    }));
  });

  it('filters and paginates sales history', async () => {
    const { service, salesQuery } = setup(4);

    const result = await service.findAll({
      search: 'coffee',
      from: '2026-01-01',
      to: '2026-01-31',
      minAmount: 5,
      maxAmount: 100,
      page: 2,
      limit: 10,
    });

    expect(salesQuery.andWhere).toHaveBeenCalledTimes(5);
    expect(salesQuery.skip).toHaveBeenCalledWith(10);
    expect(result.meta.total).toBe(1);
  });

  it('caches individual sale reads and rejects missing sales', async () => {
    const { service, salesRepository, cache } = setup(4);

    await expect(service.findOne(22)).resolves.toEqual({ id: 22 });
    expect(cache.remember).toHaveBeenCalledWith('sales:item:22', expect.any(Function));

    salesRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
