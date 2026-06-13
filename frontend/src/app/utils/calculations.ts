import { CartItem } from '@app/models';

export function totalQuantity(items: ReadonlyArray<{ quantity: number }>): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function cartTotal(items: ReadonlyArray<CartItem>): number {
  return items.reduce((total, item) => total + Number(item.product.price) * item.quantity, 0);
}

export function sumMoney(values: ReadonlyArray<string | number>): number {
  return values.reduce<number>((total, value) => total + Number(value), 0);
}

export function clampQuantity(quantity: number, available: number): number {
  if (available <= 0) return 0;
  const normalized = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  return Math.min(Math.max(normalized, 1), available);
}
