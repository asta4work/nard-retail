import { Product } from './product.model';
import { User } from './user.model';

export interface SaleItem {
  id: number;
  product: Product;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
}

export interface Sale {
  id: number;
  customerName: string | null;
  totalAmount: string;
  createdAt: string;
  createdBy: User;
  items: SaleItem[];
}
