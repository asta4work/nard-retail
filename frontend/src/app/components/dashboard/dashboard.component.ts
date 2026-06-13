import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';
import { AuthService } from '@app/services/auth.service';
import { sumMoney } from '@app/utils/calculations';
import { getErrorMessage } from '@app/utils/http.utils';
import { Page, Product, Sale } from '@app/models';
import { ProductsService } from '@app/services/products.service';
import { SalesService } from '@app/services/sales.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  readonly auth = inject(AuthService);
  readonly products = signal<Page<Product> | null>(null);
  readonly lowStock = signal<Page<Product> | null>(null);
  readonly sales = signal<Page<Sale> | null>(null);
  readonly recentTotal = computed(() => sumMoney(this.sales()?.data.map((sale) => sale.totalAmount) ?? []));
  readonly error = signal('');

  constructor() {
    combineLatest({
      products: inject(ProductsService).list({ limit: 1 }),
      lowStock: inject(ProductsService).list({ availability: 'low-stock', limit: 5, sort: 'stock', order: 'ASC' }),
      sales: inject(SalesService).list({ limit: 5 }),
    }).subscribe({
      next: ({ products, lowStock, sales }) => {
        this.products.set(products);
        this.lowStock.set(lowStock);
        this.sales.set(sales);
      },
      error: (error) => this.error.set(getErrorMessage(error, 'Unable to load the dashboard')),
    });
  }
}
