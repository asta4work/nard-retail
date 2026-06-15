import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto, ProductQueryDto, UpdateProductDto } from './product.dto';
import { Product } from './product.entity';
import { InventoryGateway } from '../realtime/inventory.gateway';
import { CACHE_STORE, CacheStore } from '../cache/cache-store';
import { pageResult } from '../common/page';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly products: Repository<Product>,
    private readonly inventoryGateway: InventoryGateway,
    @Inject(CACHE_STORE) private readonly cache: CacheStore,
  ) {}

  async create(dto: CreateProductDto) {
    const product = await this.products.save(this.products.create({ ...dto, price: dto.price.toFixed(2) }));
    await this.invalidateProductCache();
    this.inventoryGateway.broadcastProductChange({ action: 'created', productId: product.id });
    return product;
  }

  async findAll(query: ProductQueryDto) {
    return this.cache.remember(this.cache.key('products:list', query), async () => {
      const qb = this.products.createQueryBuilder('product');
      if (query.search) {
        const terms = query.search.split(/\s+/)
          .map((term) => term.replace(/[+\-><()~*"@]+/g, ''))
          .filter(Boolean)
          .map((term) => `${term}*`)
          .join(' ');
        if (terms) qb.andWhere('MATCH(product.name, product.description) AGAINST (:search IN BOOLEAN MODE)', { search: terms });
      }
      if (query.category) qb.andWhere('product.category = :category', { category: query.category });
      if (query.minPrice !== undefined) qb.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
      if (query.maxPrice !== undefined) qb.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
      if (query.availability === 'in-stock') qb.andWhere('product.stockQuantity > 0');
      if (query.availability === 'low-stock') qb.andWhere('product.stockQuantity BETWEEN 1 AND 10');
      if (query.availability === 'out-of-stock') qb.andWhere('product.stockQuantity = 0');

      const sortMap: Record<string, string> = { price: 'product.price', stock: 'product.stockQuantity', newest: 'product.createdAt', name: 'product.name' };
      qb.orderBy(sortMap[query.sort], query.order.toUpperCase() as 'ASC' | 'DESC')
        .skip((query.page - 1) * query.limit)
        .take(query.limit);
      const [data, total] = await qb.getManyAndCount();
      return pageResult(data, total, query.page, query.limit);
    });
  }

  async findOne(id: number) {
    return this.cache.remember(this.cache.key('products:item', id), () => this.findEntity(id));
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.findEntity(id);
    Object.assign(product, dto, dto.price === undefined ? {} : { price: dto.price.toFixed(2) });
    const saved = await this.products.save(product);
    await this.invalidateProductCache();
    this.inventoryGateway.broadcastProductChange({ action: 'updated', productId: saved.id });
    return saved;
  }

  async remove(id: number) {
    const product = await this.findEntity(id);
    await this.products.remove(product);
    await this.invalidateProductCache();
    this.inventoryGateway.broadcastProductChange({ action: 'deleted', productId: id });
    return { deleted: true };
  }

  async categories() {
    return this.cache.remember('products:categories', async () => {
      const rows = await this.products.createQueryBuilder('product')
        .select('product.category', 'category')
        .distinct(true)
        .orderBy('product.category', 'ASC')
        .getRawMany<{ category: string }>();
      return rows.map((row) => row.category);
    });
  }

  private invalidateProductCache() {
    return this.cache.invalidate('products:', 'reports:');
  }

  private async findEntity(id: number) {
    const product = await this.products.findOneBy({ id });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
