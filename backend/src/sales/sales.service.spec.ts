import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Role } from '../common/role.enum';
import { Product } from '../products/product.entity';
import { InventoryGateway } from '../realtime/inventory.gateway';
import { User } from '../users/user.entity';
import { Sale } from './sale.entity';
import { SalesService } from './sales.service';

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
    const salesRepository = { findOne: jest.fn().mockResolvedValue({ id: 22 }) };
    const dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
      getRepository: jest.fn().mockReturnValue(salesRepository),
    } as unknown as DataSource;
    return { service: new SalesService(dataSource, gateway), gateway, manager };
  }

  it('decrements stock and broadcasts only after a successful checkout', async () => {
    const { service, gateway, manager } = setup(4);

    await service.checkout({ items: [{ productId: 5, quantity: 2 }] }, user);

    expect(manager.save).toHaveBeenCalledWith([expect.objectContaining({ id: 5, stockQuantity: 2 })]);
    expect(gateway.broadcastStock).toHaveBeenCalledWith([{ productId: 5, stockQuantity: 2 }]);
  });

  it('rejects overselling without broadcasting a stock update', async () => {
    const { service, gateway } = setup(1);

    await expect(service.checkout({ items: [{ productId: 5, quantity: 2 }] }, user)).rejects.toBeInstanceOf(BadRequestException);
    expect(gateway.broadcastStock).not.toHaveBeenCalled();
  });
});
