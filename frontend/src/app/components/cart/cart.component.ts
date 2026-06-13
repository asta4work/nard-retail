import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { printPage } from '@app/utils/browser.utils';
import { CartService } from '@app/services/cart.service';
import { Sale } from '@app/models';
import { SalesService } from '@app/services/sales.service';
import { handleRequest } from '@app/utils/request.utils';

@Component({
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart.component.html',
})
export class CartComponent {
  readonly cart = inject(CartService);
  private readonly sales = inject(SalesService);
  readonly customerName = new FormControl('', { nonNullable: true });
  loading = false;
  error = '';
  invoice?: Sale;
  readonly print = printPage;

  checkout() {
    if (!this.cart.items.length) return;
    handleRequest(this.sales.checkout(this.customerName.value, this.cart.items), 'Checkout failed', {
      setError: (error) => this.error = error,
      setLoading: (loading) => this.loading = loading,
    }).subscribe({
      next: (sale) => { this.invoice = sale; this.cart.clear(); this.customerName.reset(); },
    });
  }
}
