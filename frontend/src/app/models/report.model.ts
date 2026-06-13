export interface SalesReport {
  summary: { totalSales: string; todaySales: string; monthSales: string; transactionCount: string };
  daily: { date: string; total: string }[];
  bestSelling: { id: number; name: string; quantitySold: string; revenue: string }[];
  categoryPerformance: { category: string; quantitySold: string; revenue: string }[];
}

export interface InventoryReport {
  summary: {
    productCount: string;
    unitsInStock: string;
    totalStockValue: string;
    outOfStockCount: string;
    lowStockCount: string;
  };
  lowStock: { id: number; name: string; category: string; stockQuantity: number; price: string }[];
}
