import { describe, expect, it } from 'vitest';
import { cartTotal, clampQuantity, sumMoney, totalQuantity } from './calculations';
import { CartItem } from '@app/models';

describe('calculation utilities', () => {
  const items = [
    { product: { price: '12.50' }, quantity: 2 },
    { product: { price: '5.00' }, quantity: 1 },
  ] as CartItem[];

  it('calculates cart quantities and money totals', () => {
    expect(totalQuantity(items)).toBe(3);
    expect(cartTotal(items)).toBe(30);
    expect(sumMoney(['10.25', 4.75])).toBe(15);
  });

  it('clamps quantities to valid stock bounds', () => {
    expect(clampQuantity(0, 10)).toBe(1);
    expect(clampQuantity(20, 10)).toBe(10);
    expect(clampQuantity(3.8, 10)).toBe(3);
    expect(clampQuantity(3, 0)).toBe(0);
  });
});
