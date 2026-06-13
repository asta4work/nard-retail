import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { cartTotal, clampQuantity, totalQuantity } from '@app/utils/calculations';
import { CartItem, Product } from '@app/models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>([]);
  readonly items$ = this.itemsSubject.asObservable();
  readonly count$ = this.items$.pipe(map(totalQuantity));

  get items() {
    return this.itemsSubject.value;
  }

  get count() {
    return totalQuantity(this.items);
  }

  get total() {
    return cartTotal(this.items);
  }

  add(product: Product) {
    if (product.stockQuantity <= 0) return;
    const found = this.items.some((item) => item.product.id === product.id);
    const items = found
      ? this.items.map((item) => item.product.id === product.id
        ? { ...item, quantity: clampQuantity(item.quantity + 1, product.stockQuantity) }
        : item)
      : [...this.items, { product, quantity: 1 }];
    this.itemsSubject.next(items);
  }

  update(productId: number, quantity: number) {
    const items = this.items.map((item) => item.product.id === productId
      ? { ...item, quantity: clampQuantity(quantity, item.product.stockQuantity) }
      : item);
    this.itemsSubject.next(items);
  }

  syncStock(productId: number, stockQuantity: number) {
    const items = this.items
      .map((item) => item.product.id === productId
        ? {
          ...item,
          product: { ...item.product, stockQuantity },
          quantity: clampQuantity(item.quantity, stockQuantity),
        }
        : item)
      .filter((item) => item.quantity > 0);
    this.itemsSubject.next(items);
  }

  remove(productId: number) {
    this.itemsSubject.next(this.items.filter((item) => item.product.id !== productId));
  }

  clear() {
    this.itemsSubject.next([]);
  }
}
