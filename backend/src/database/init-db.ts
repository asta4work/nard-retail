import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { resolve } from 'path';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Role } from '../common/role.enum';
import { Product } from '../products/product.entity';
import { ProductIcon } from '../products/product-icons';
import { SaleItem } from '../sales/sale-item.entity';
import { Sale } from '../sales/sale.entity';
import { User } from '../users/user.entity';
import { databaseOptions } from './database.config';

config({ path: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../.env')] });

const dataSource = new DataSource({ ...databaseOptions(), synchronize: true });

type SeedLocale = 'en' | 'ar' | 'mixed';
type SeedProduct = Pick<Product, 'name' | 'description' | 'price' | 'stockQuantity' | 'category' | 'icon'>;

const seedConfig = {
  locale: readLocale(process.env.SEED_LOCALE),
  productCount: readCount('SEED_PRODUCT_COUNT', 1000),
  userCount: readCount('SEED_USER_COUNT', 100),
  saleCount: readCount('SEED_SALE_COUNT', 2500),
  batchSize: readCount('SEED_BATCH_SIZE', 250, 25, 1000),
};

const baseProducts: SeedProduct[] = [
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

const baseUsers = [
  { name: 'Maya Chen', email: 'maya.employee@retail.local', role: Role.Employee },
  { name: 'Omar Saleh', email: 'omar.employee@retail.local', role: Role.Employee },
  { name: 'Nora Manager', email: 'nora.admin@retail.local', role: Role.Admin },
];

const catalogs: Record<'en' | 'ar', Array<{ category: string; names: string[]; description: string; icon: ProductIcon }>> = {
  en: [
    { category: 'Electronics', names: ['Wireless Mouse', 'USB-C Hub', 'Portable Speaker', 'Smart Charger'], description: 'Reliable electronics selected for everyday use.', icon: 'laptop' },
    { category: 'Food & Drink', names: ['Premium Coffee', 'Herbal Tea', 'Snack Box', 'Date Selection'], description: 'Fresh food and drink prepared for retail shelves.', icon: 'coffee' },
    { category: 'Apparel', names: ['Cotton Shirt', 'Everyday Hoodie', 'Classic Cap', 'Comfort Socks'], description: 'Comfortable apparel in popular retail styles.', icon: 'shirt' },
    { category: 'Home', names: ['Kitchen Set', 'Storage Basket', 'Ceramic Plate', 'Travel Bottle'], description: 'Practical home products for modern daily life.', icon: 'utensils' },
    { category: 'Stationery', names: ['Daily Notebook', 'Office Pen Set', 'Desk Organizer', 'Weekly Planner'], description: 'Useful stationery for work, school, and planning.', icon: 'book-open' },
    { category: 'Gifts', names: ['Celebration Bundle', 'Premium Gift Box', 'Seasonal Set', 'Thank You Pack'], description: 'Gift-ready products for every occasion.', icon: 'sparkles' },
  ],
  ar: [
    { category: 'إلكترونيات', names: ['فأرة لاسلكية', 'موزع يو إس بي', 'سماعة محمولة', 'شاحن ذكي'], description: 'منتج إلكتروني عملي ومناسب للاستخدام اليومي.', icon: 'laptop' },
    { category: 'أطعمة ومشروبات', names: ['قهوة فاخرة', 'شاي أعشاب', 'صندوق وجبات خفيفة', 'تشكيلة تمور'], description: 'منتج طازج ومناسب لرفوف المتجر.', icon: 'coffee' },
    { category: 'ملابس', names: ['قميص قطني', 'سترة يومية', 'قبعة كلاسيكية', 'جوارب مريحة'], description: 'ملابس مريحة بتصاميم مناسبة للاستخدام اليومي.', icon: 'shirt' },
    { category: 'المنزل', names: ['طقم مطبخ', 'سلة تخزين', 'طبق سيراميك', 'زجاجة سفر'], description: 'منتج منزلي عملي للحياة العصرية.', icon: 'utensils' },
    { category: 'قرطاسية', names: ['دفتر يومي', 'طقم أقلام مكتبية', 'منظم مكتب', 'مخطط أسبوعي'], description: 'قرطاسية مفيدة للعمل والدراسة والتخطيط.', icon: 'book-open' },
    { category: 'هدايا', names: ['باقة احتفال', 'صندوق هدايا فاخر', 'تشكيلة موسمية', 'باقة شكر'], description: 'هدية جاهزة ومناسبة لمختلف المناسبات.', icon: 'sparkles' },
  ],
};

const customerNames = {
  en: ['Walk-in customer', 'Olivia Smith', 'Noah Williams', 'Emma Brown', 'Liam Jones', 'Sophia Davis'],
  ar: ['عميل مباشر', 'محمد أحمد', 'سارة علي', 'عمر خالد', 'نورة حسن', 'ليان عبدالله'],
};

function readLocale(value: string | undefined): SeedLocale {
  return value === 'en' || value === 'ar' || value === 'mixed' ? value : 'mixed';
}

function readCount(name: string, fallback: number, min = 0, max = 100_000) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function languageAt(index: number): 'en' | 'ar' {
  return seedConfig.locale === 'mixed' ? (index % 2 === 0 ? 'en' : 'ar') : seedConfig.locale;
}

function batches<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

function generatedProducts(): SeedProduct[] {
  return Array.from({ length: seedConfig.productCount }, (_, index) => {
    const language = languageAt(index);
    const catalog = catalogs[language][index % catalogs[language].length];
    const baseName = catalog.names[Math.floor(index / catalogs[language].length) % catalog.names.length];
    const sequence = String(index + 1).padStart(5, '0');
    const price = (1 + ((index * 379) % 99_900) / 100).toFixed(2);
    const stockQuantity = index % 17 === 0 ? 0 : (index * 29) % 251;
    return {
      name: language === 'ar' ? `${baseName} تجريبي ${sequence}` : `${baseName} Demo ${sequence}`,
      description: `${catalog.description} ${language === 'ar' ? 'رقم' : 'Item'} ${sequence}.`,
      price,
      stockQuantity,
      category: catalog.category,
      icon: catalog.icon,
    };
  });
}

function generatedUsers(passwordHash: string) {
  return Array.from({ length: seedConfig.userCount }, (_, index) => {
    const language = languageAt(index);
    const sequence = String(index + 1).padStart(5, '0');
    return {
      name: language === 'ar' ? `موظف تجريبي ${sequence}` : `Demo Employee ${sequence}`,
      email: `seed.${language}.${sequence}@retail.local`,
      passwordHash,
      role: index % 25 === 0 ? Role.Admin : Role.Employee,
      active: index % 19 !== 0,
    };
  });
}

async function insertMissing<T extends object>(
  repository: Repository<T>,
  values: T[],
  existingKeys: Set<string>,
  getKey: (value: T) => string,
) {
  const missing = values.filter((value) => !existingKeys.has(getKey(value)));
  for (const batch of batches(missing, seedConfig.batchSize)) await repository.insert(batch);
  return missing.length;
}

async function mergeUsers(manager: EntityManager) {
  const repository = manager.getRepository(User);
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
  const admin = {
    name: process.env.ADMIN_NAME || 'System Admin',
    email: (process.env.ADMIN_EMAIL || 'admin@retail.local').toLowerCase(),
    passwordHash,
    role: Role.Admin,
    active: true,
  };
  const existingEmails = new Set((await repository.find({ select: { email: true } })).map((user) => user.email));
  return insertMissing(repository, [admin, ...baseUsers.map((user) => ({ ...user, passwordHash, active: true })), ...generatedUsers(passwordHash)] as User[], existingEmails, (user) => user.email);
}

async function mergeProducts(manager: EntityManager) {
  const repository = manager.getRepository(Product);
  const existingNames = new Set((await repository.find({ select: { name: true } })).map((product) => product.name));
  return insertMissing(repository, [...baseProducts, ...generatedProducts()] as Product[], existingNames, (product) => product.name);
}

async function mergeDemoSales(manager: EntityManager) {
  const [{ applied }] = await manager.query(
    'SELECT COUNT(*) applied FROM app_seed_history WHERE seed_key = ?',
    ['demo-sales-v1'],
  );
  if (Number(applied) > 0) return;

  const user = await manager.getRepository(User).findOne({ where: { email: (process.env.ADMIN_EMAIL || 'admin@retail.local').toLowerCase() } });
  const seededProducts = await manager.getRepository(Product).findBy(baseProducts.slice(0, 6).map(({ name }) => ({ name })));
  if (!user || seededProducts.length < 6) throw new Error('Seed users and products must exist before demo sales are created');

  const samples = [
    { customerName: 'Walk-in customer', items: [[0, 2], [1, 1]] },
    { customerName: 'Lina Ahmed', items: [[2, 2], [3, 1]] },
    { customerName: 'Walk-in customer', items: [[4, 1], [5, 2]] },
    { customerName: 'Samir Khan', items: [[0, 1], [2, 1], [3, 1]] },
  ] as const;
  const productsByName = new Map(seededProducts.map((product) => [product.name, product]));

  for (const sample of samples) {
    const items = sample.items.map(([index, quantity]) => {
      const product = productsByName.get(baseProducts[index].name)!;
      const lineTotal = Number(product.price) * quantity;
      return manager.create(SaleItem, { product, quantity, unitPrice: product.price, lineTotal: lineTotal.toFixed(2) });
    });
    const total = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
    await manager.save(manager.create(Sale, { customerName: sample.customerName, totalAmount: total.toFixed(2), createdBy: user, items }));
  }
  await manager.query('INSERT INTO app_seed_history (seed_key) VALUES (?)', ['demo-sales-v1']);
}

async function generateBulkSales() {
  const stateKey = `bulk-sales-v2-${seedConfig.locale}`;
  const [{ itemCount = 0 } = {}] = await dataSource.query(
    'SELECT item_count itemCount FROM app_seed_state WHERE seed_key = ?',
    [stateKey],
  );
  let created = Number(itemCount);
  if (created >= seedConfig.saleCount) return 0;

  const [products, users] = await Promise.all([
    dataSource.getRepository(Product).find({ order: { id: 'ASC' } }),
    dataSource.getRepository(User).find({ where: { active: true }, order: { id: 'ASC' } }),
  ]);
  if (!products.length || !users.length) throw new Error('Products and active users are required before bulk sales are generated');

  while (created < seedConfig.saleCount) {
    const end = Math.min(created + seedConfig.batchSize, seedConfig.saleCount);
    await dataSource.transaction(async (manager) => {
      const sales: Sale[] = [];
      for (let index = created; index < end; index++) {
        const language = languageAt(index);
        const itemCount = 1 + (index % 4);
        const items: SaleItem[] = [];
        for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
          const product = products[(index * 17 + itemIndex * 31) % products.length];
          const quantity = 1 + ((index + itemIndex) % 5);
          const lineTotal = Number(product.price) * quantity;
          items.push(manager.create(SaleItem, { product, quantity, unitPrice: product.price, lineTotal: lineTotal.toFixed(2) }));
        }
        const total = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
        const createdAt = new Date(Date.now() - ((index * 37) % 365) * 86_400_000 - (index % 24) * 3_600_000);
        sales.push(manager.create(Sale, {
          customerName: customerNames[language][index % customerNames[language].length],
          totalAmount: total.toFixed(2),
          createdBy: users[index % users.length],
          items,
          createdAt,
        }));
      }
      await manager.save(Sale, sales, { chunk: seedConfig.batchSize });
      await manager.query(
        `INSERT INTO app_seed_state (seed_key, item_count) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE item_count = VALUES(item_count)`,
        [stateKey, end],
      );
    });
    created = end;
    console.log(`Generated ${created}/${seedConfig.saleCount} bulk sales...`);
  }
  return seedConfig.saleCount - Number(itemCount);
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
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS app_seed_state (
      seed_key VARCHAR(100) PRIMARY KEY,
      item_count INT UNSIGNED NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const { insertedUsers, insertedProducts } = await dataSource.transaction(async (manager) => ({
    insertedUsers: await mergeUsers(manager),
    insertedProducts: await mergeProducts(manager),
  }));
  await dataSource.transaction((manager) => mergeDemoSales(manager));
  const insertedSales = await generateBulkSales();

  const [productCount, userCount, saleCount] = await Promise.all([
    dataSource.getRepository(Product).count(),
    dataSource.getRepository(User).count(),
    dataSource.getRepository(Sale).count(),
  ]);
  console.log(`Seed locale: ${seedConfig.locale}. Added ${insertedProducts} products, ${insertedUsers} users, and ${insertedSales} sales.`);
  console.log(`Database totals: ${productCount} products, ${userCount} users, ${saleCount} sales.`);
}

main()
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exitCode = 1;
  })
  .finally(() => dataSource.isInitialized && dataSource.destroy());
