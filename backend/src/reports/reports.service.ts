import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CACHE_STORE, CacheStore } from '../cache/cache-store';

@Injectable()
export class ReportsService {
  constructor(
    private readonly dataSource: DataSource,
    @Inject(CACHE_STORE) private readonly cache: CacheStore,
  ) {}

  async sales() {
    return this.cache.remember('reports:sales', async () => {
      const [summaryRows, daily, monthly, bestSelling, categoryPerformance] = await Promise.all([
        this.dataSource.query(`
      SELECT COALESCE(SUM(total_amount), 0) totalSales,
             COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END), 0) todaySales,
             COALESCE(SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) THEN total_amount ELSE 0 END), 0) monthSales,
             COUNT(*) transactionCount
      FROM sales
    `),
        this.dataSource.query(`
      SELECT DATE(created_at) date, SUM(total_amount) total
      FROM sales WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
      GROUP BY DATE(created_at) ORDER BY date
    `),
        this.dataSource.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') month, SUM(total_amount) total
      FROM sales WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 11 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month
    `),
        this.dataSource.query(`
      SELECT p.id, p.name, SUM(si.quantity) quantitySold, SUM(si.line_total) revenue
      FROM sale_items si INNER JOIN products p ON p.id = si.productId
      GROUP BY p.id, p.name ORDER BY quantitySold DESC LIMIT 10
    `),
        this.dataSource.query(`
      SELECT p.category, SUM(si.quantity) quantitySold, SUM(si.line_total) revenue
      FROM sale_items si INNER JOIN products p ON p.id = si.productId
      GROUP BY p.category ORDER BY revenue DESC
    `),
      ]);
      return { summary: summaryRows[0], daily, monthly, bestSelling, categoryPerformance };
    });
  }

  async inventory() {
    return this.cache.remember('reports:inventory', async () => {
      const [summaryRows, lowStock] = await Promise.all([
        this.dataSource.query(`
      SELECT COUNT(*) productCount,
             COALESCE(SUM(stock_quantity), 0) unitsInStock,
             COALESCE(SUM(price * stock_quantity), 0) totalStockValue,
             SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END) outOfStockCount,
             SUM(CASE WHEN stock_quantity BETWEEN 1 AND 10 THEN 1 ELSE 0 END) lowStockCount
      FROM products
    `),
        this.dataSource.query(`
      SELECT id, name, category, stock_quantity stockQuantity, price
      FROM products WHERE stock_quantity <= 10 ORDER BY stock_quantity, name LIMIT 100
    `),
      ]);
      return { summary: summaryRows[0], lowStock };
    });
  }
}
