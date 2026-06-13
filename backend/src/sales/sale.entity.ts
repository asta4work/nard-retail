import { Column, CreateDateColumn, Entity, Index, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { SaleItem } from './sale-item.entity';

@Entity('sales')
@Index('IDX_sales_created_at', ['createdAt'])
@Index('IDX_sales_total_amount', ['totalAmount'])
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_name', type: 'varchar', length: 180, nullable: true })
  customerName: string | null;

  @Column({ name: 'total_amount', type: 'decimal', precision: 14, scale: 2 })
  totalAmount: string;

  @ManyToOne(() => User, { nullable: false, eager: true, onDelete: 'RESTRICT' })
  createdBy: User;

  @OneToMany(() => SaleItem, (item) => item.sale, { cascade: true, eager: true })
  items: SaleItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
