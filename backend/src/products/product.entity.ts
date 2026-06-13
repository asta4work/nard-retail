import { Check, Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { SaleItem } from '../sales/sale-item.entity';

@Entity('products')
@Index('IDX_products_category', ['category'])
@Index('IDX_products_stock', ['stockQuantity'])
@Index('IDX_products_created_at', ['createdAt'])
@Index('IDX_products_search', ['name', 'description'], { fulltext: true })
@Check('CHK_products_price_positive', '`price` > 0')
@Check('CHK_products_stock_nonnegative', '`stock_quantity` >= 0')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 180 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: string;

  @Column({ name: 'stock_quantity', type: 'int', unsigned: true, default: 0 })
  stockQuantity: number;

  @Column({ length: 100 })
  category: string;

  @Column({ length: 40, default: 'package' })
  icon: string;

  @OneToMany(() => SaleItem, (item) => item.product)
  saleItems: SaleItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
