import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Product } from '../products/product.entity';
import { InventoryGateway, StockUpdate } from '../realtime/inventory.gateway';
import { User } from '../users/user.entity';
import { CheckoutDto, SalesQueryDto } from './sales.dto';
import { SaleItem } from './sale-item.entity';
import { Sale } from './sale.entity';
import { CACHE_STORE, CacheStore } from '../cache/cache-store';
import { pageResult } from '../common/page';

@Injectable()
export class SalesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly inventoryGateway: InventoryGateway,
    @Inject(CACHE_STORE) private readonly cache: CacheStore,
  ) {}

  async checkout(dto: CheckoutDto, user: User) {
    const normalized = new Map<number, number>();
    for (const item of dto.items) normalized.set(item.productId, (normalized.get(item.productId) ?? 0) + item.quantity);

    const result = await this.dataSource.transaction(async (manager) => {
      const productIds = [...normalized.keys()].sort((a, b) => a - b);
      const products = await manager.createQueryBuilder(Product, 'product')
        .setLock('pessimistic_write')
        .whereInIds(productIds)
        .getMany();
      if (products.length !== productIds.length) throw new BadRequestException('One or more products no longer exist');

      let total = 0;
      const items = products.map((product) => {
        const quantity = normalized.get(product.id)!;
        if (product.stockQuantity < quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.name}; ${product.stockQuantity} available`);
        }
        const lineTotal = Number(product.price) * quantity;
        total += lineTotal;
        product.stockQuantity -= quantity;
        return manager.create(SaleItem, {
          product,
          quantity,
          unitPrice: product.price,
          lineTotal: lineTotal.toFixed(2),
        });
      });

      await manager.save(products);
      const sale = manager.create(Sale, {
        customerName: dto.customerName?.trim() || null,
        totalAmount: total.toFixed(2),
        createdBy: user,
        items,
      });
      const saved = await manager.save(sale);
      return {
        saleId: saved.id,
        updates: products.map((product) => ({ productId: product.id, stockQuantity: product.stockQuantity })),
      };
    });

    await this.cache.invalidate('products:', 'reports:', 'sales:');
    this.inventoryGateway.broadcastStock(result.updates);
    return this.findOne(result.saleId);
  }

  async findAll(query: SalesQueryDto) {
    return this.cache.remember(this.cache.key('sales:list', query), async () => {
      const qb = this.dataSource.getRepository(Sale).createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('sale.createdBy', 'createdBy')
      .orderBy('sale.createdAt', 'DESC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);
      if (query.search) {
        qb.andWhere('(sale.customerName LIKE :search OR CAST(sale.id AS CHAR) LIKE :search OR product.name LIKE :search)', { search: `%${query.search}%` });
      }
      if (query.from) qb.andWhere('sale.createdAt >= :from', { from: query.from });
      if (query.to) qb.andWhere('sale.createdAt <= :to', { to: `${query.to} 23:59:59` });
      if (query.minAmount !== undefined) qb.andWhere('sale.totalAmount >= :minAmount', { minAmount: query.minAmount });
      if (query.maxAmount !== undefined) qb.andWhere('sale.totalAmount <= :maxAmount', { maxAmount: query.maxAmount });
      const [data, total] = await qb.getManyAndCount();
      return pageResult(data, total, query.page, query.limit);
    });
  }

  async findOne(id: number) {
    return this.cache.remember(this.cache.key('sales:item', id), async () => {
      const sale = await this.dataSource.getRepository(Sale).findOne({ where: { id } });
      if (!sale) throw new NotFoundException('Sale not found');
      return sale;
    });
  }
}
