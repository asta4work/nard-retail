import { Product } from '../products/product.entity';
import { SaleItem } from '../sales/sale-item.entity';
import { Sale } from '../sales/sale.entity';
import { User } from '../users/user.entity';

type ReadEnvironment = (key: string) => string | undefined;

export function databaseOptions(read: ReadEnvironment = (key) => process.env[key]) {
  return {
    type: 'mysql' as const,
    host: read('DB_HOST') || 'localhost',
    port: Number(read('DB_PORT') || 3306),
    username: read('DB_USER') || read('MYSQL_USER') || 'retail',
    password: read('DB_PASSWORD') || read('MYSQL_PASSWORD') || 'retail_password',
    database: read('DB_NAME') || read('MYSQL_DATABASE') || 'retail_ops',
    entities: [User, Product, Sale, SaleItem],
    synchronize: (read('DB_SYNCHRONIZE') || 'true') === 'true',
    logging: (read('DB_LOGGING') || 'false') === 'true',
  };
}
