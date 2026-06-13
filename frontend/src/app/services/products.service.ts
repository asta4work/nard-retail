import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { Page, Product, ProductInput } from '@app/models';
import { QueryParams } from '@app/types';
import { toHttpParams } from '@app/utils/http.utils';
import { Observable, ReplaySubject, shareReplay, tap } from 'rxjs';
import { StockUpdate } from './realtime.service';

interface ProductPageCache {
  query: QueryParams;
  subject: ReplaySubject<Page<Product>>;
  latest?: Page<Product>;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly pageCache = new Map<string, ProductPageCache>();
  private readonly productCache = new Map<number, Observable<Product>>();
  private categoriesCache?: Observable<string[]>;

  constructor(private readonly http: HttpClient) {}

  list(query: QueryParams) {
    const normalized = { ...query };
    const key = JSON.stringify(Object.entries(normalized).filter(([, value]) => value !== undefined && value !== ''));
    let entry = this.pageCache.get(key);
    if (!entry) {
      entry = { query: normalized, subject: new ReplaySubject<Page<Product>>(1) };
      this.pageCache.set(key, entry);
      this.fetchPage(key, entry);
    }
    return entry.subject.asObservable();
  }

  categories() {
    this.categoriesCache ??= this.http.get<string[]>(`${environment.apiUrl}/products/categories`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.categoriesCache;
  }

  get(id: number) {
    let product = this.productCache.get(id);
    if (!product) {
      product = this.http.get<Product>(`${environment.apiUrl}/products/${id}`)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.productCache.set(id, product);
    }
    return product;
  }

  create(product: ProductInput) {
    return this.http.post<Product>(`${environment.apiUrl}/products`, product).pipe(tap(() => this.clearCaches()));
  }

  update(id: number, product: Partial<ProductInput>) {
    return this.http.patch<Product>(`${environment.apiUrl}/products/${id}`, product).pipe(tap(() => this.clearCaches()));
  }

  remove(id: number) {
    return this.http.delete(`${environment.apiUrl}/products/${id}`).pipe(tap(() => this.clearCaches()));
  }

  applyStockUpdates(updates: StockUpdate[]) {
    const stocks = new Map(updates.map((update) => [update.productId, update.stockQuantity]));
    for (const entry of this.pageCache.values()) {
      if (!entry.latest) continue;
      const data = entry.latest.data.map((product) => stocks.has(product.id)
        ? { ...product, stockQuantity: stocks.get(product.id)! }
        : product);
      entry.latest = { ...entry.latest, data };
      entry.subject.next(entry.latest);
    }
    updates.forEach((update) => this.productCache.delete(update.productId));
  }

  refreshCachedPages() {
    this.productCache.clear();
    this.categoriesCache = undefined;
    for (const [key, entry] of this.pageCache) this.fetchPage(key, entry);
  }

  private clearCaches() {
    this.pageCache.clear();
    this.productCache.clear();
    this.categoriesCache = undefined;
  }

  private fetchPage(key: string, entry: ProductPageCache) {
    this.http.get<Page<Product>>(`${environment.apiUrl}/products`, { params: toHttpParams(entry.query) }).subscribe({
      next: (page) => {
        entry.latest = page;
        entry.subject.next(page);
      },
      error: (error) => {
        this.pageCache.delete(key);
        entry.subject.error(error);
      },
    });
  }
}
