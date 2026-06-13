import { ProductIcon } from '@app/types';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stockQuantity: number;
  category: string;
  icon: ProductIcon;
  createdAt: string;
  updatedAt: string;
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  category: string;
  icon: ProductIcon;
}
