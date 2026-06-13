import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource, EntityManager } from 'typeorm';
import { Role } from '../common/role.enum';
import { Product } from '../products/product.entity';
import { ProductIcon } from '../products/product-icons';
import { SaleItem } from '../sales/sale-item.entity';
import { Sale } from '../sales/sale.entity';
import { User } from '../users/user.entity';
import { databaseOptions } from './database.config';

config({ path: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../.env')] });

const dataSource = new DataSource({ ...databaseOptions(), synchronize: true });

const products: Array<{
  name: string;
  description: string;
  price: string;
  stockQuantity: number;
  category: string;
  icon: ProductIcon;
}> = [
  { name: 'House Blend Coffee', description: 'Balanced whole-bean coffee for everyday brewing.', price: '14.50', stockQuantity: 36, category: 'Food & Drink', icon: 'coffee' },
  { name: 'Ceramic Travel Mug', description: 'Reusable 350 ml mug with a silicone lid.', price: '18.00', stockQuantity: 18, category: 'Home', icon: 'coffee' },
  { name: 'Everyday T-Shirt', description: 'Soft cotton crew-neck shirt.', price: '24.00', stockQuantity: 42, category: 'Apparel', icon: 'shirt' },
  { name: 'Canvas Tote Bag', description: 'Durable reusable shopping tote.', price: '12.00', stockQuantity: 8, category: 'Accessories', icon: 'shopping-bag' },
  { name: 'Wireless Keyboard', description: 'Compact wireless keyboard with quiet keys.', price: '49.00', stockQuantity: 14, category: 'Electronics', icon: 'laptop' },
  { name: 'USB-C Charger', description: 'Fast 45W wall charger.', price: '29.00', stockQuantity: 6, category: 'Electronics', icon: 'laptop' },
  { name: 'Weekly Planner', description: 'Undated planner for projects and daily notes.', price: '16.00', stockQuantity: 25, category: 'Stationery', icon: 'book-open' },
  { name: 'Stainless Cutlery Set', description: 'Portable fork, spoon, and knife set.', price: '11.50', stockQuantity: 0, category: 'Home', icon: 'utensils' },
  { name: 'Gift Bundle', description: 'A ready-to-give collection of store favorites.', price: '58.00', stockQuantity: 10, category: 'Gifts', icon: 'sparkles' },
];

const users = [
  { name: 'Maya Chen', email: 'maya.employee@retail.local', role: Role.Employee },
  { name: 'Omar Saleh', email: 'omar.employee@retail.local', role: Role.Employee },
  { name: 'Nora Manager', email: 'nora.admin@retail.local', role: Role.Admin },
];

async function mergeUsers(manager: EntityManager) {
  const repository = manager.getRepository(User);
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
  const admin = {
    name: process.env.ADMIN_NAME || 'System Admin',
    email: (process.env.ADMIN_EMAIL || 'admin@retail.local').toLowerCase(),
    role: Role.Admin,
  };

  for (const user of [admin, ...users]) {
    if (await repository.exists({ where: { email: user.email } })) continue;
    await repository.save(repository.create({ ...user, passwordHash }));
  }
}

async function mergeProducts(manager: EntityManager) {
  const repository = manager.getRepository(Product);
  for (const product of products) {
    const existing = await repository.findOne({ where: { name: product.name } });
    if (!existing) await repository.save(repository.create(product));
  }
}

async function mergeDemoSales(manager: EntityManager) {
  const [{ applied }] = await manager.query(
    'SELECT COUNT(*) applied FROM app_seed_history WHERE seed_key = ?',
    ['demo-sales-v1'],
  );
  if (Number(applied) > 0) return;

  const user = await manager.getRepository(User).findOne({ where: { email: (process.env.ADMIN_EMAIL || 'admin@retail.local').toLowerCase() } });
  const seededProducts = await manager.getRepository(Product).findBy(products.slice(0, 6).map(({ name }) => ({ name })));
  if (!user || seededProducts.length < 6) throw new Error('Seed users and products must exist before demo sales are created');

  const sales = [
    { customerName: 'Walk-in customer', items: [[0, 2], [1, 1]] },
    { customerName: 'Lina Ahmed', items: [[2, 2], [3, 1]] },
    { customerName: 'Walk-in customer', items: [[4, 1], [5, 2]] },
    { customerName: 'Samir Khan', items: [[0, 1], [2, 1], [3, 1]] },
  ] as const;

  const productsByName = new Map(seededProducts.map((product) => [product.name, product]));
  for (const sample of sales) {
    const items = sample.items.map(([index, quantity]) => {
      const product = productsByName.get(products[index].name)!;
      const lineTotal = Number(product.price) * quantity;
      return manager.create(SaleItem, { product, quantity, unitPrice: product.price, lineTotal: lineTotal.toFixed(2) });
    });
    const total = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
    await manager.save(manager.create(Sale, { customerName: sample.customerName, totalAmount: total.toFixed(2), createdBy: user, items }));
  }

  await manager.query('INSERT INTO app_seed_history (seed_key) VALUES (?)', ['demo-sales-v1']);
}

async function main() {
  await dataSource.initialize();
  await dataSource.synchronize();
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS app_seed_history (
      seed_key VARCHAR(100) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await dataSource.transaction(async (manager) => {
    await mergeUsers(manager);
    await mergeProducts(manager);
    await mergeDemoSales(manager);
  });

  const [productCount, userCount, saleCount] = await Promise.all([
    dataSource.getRepository(Product).count(),
    dataSource.getRepository(User).count(),
    dataSource.getRepository(Sale).count(),
  ]);
  console.log(`Database initialized: ${productCount} products, ${userCount} users, ${saleCount} sales.`);
}

main()
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exitCode = 1;
  })
  .finally(() => dataSource.isInitialized && dataSource.destroy());
