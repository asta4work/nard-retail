import { describe, expect, it } from 'vitest';
import { Product } from '@app/models';
import { CartService } from './cart.service';

describe('CartService', () => {
  const product = (stockQuantity = 5): Product => ({
    id: 1,
    name: 'Coffee',
    description: null,
    price: '12.50',
    stockQuantity,
    category: 'Drinks',
    icon: 'coffee',
    createdAt: '',
    updatedAt: '',
  });

  it('adds products without exceeding available stock', () => {
    const cart = new CartService();
    cart.add(product(2));
    cart.add(product(2));
    cart.add(product(2));

    expect(cart.count).toBe(2);
    expect(cart.total).toBe(25);
  });

  it('synchronizes stock and removes unavailable items', () => {
    const cart = new CartService();
    cart.add(product());
    cart.syncStock(1, 0);

    expect(cart.items).toEqual([]);
  });
});
