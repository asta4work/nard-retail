import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '@app/services/auth.service';
import { CartService } from '@app/services/cart.service';
import { ProductsService } from '@app/services/products.service';
import { LucideDynamicIcon } from '@lucide/angular';
import { LocalizedCurrencyPipe } from '@app/pipes/localized-currency.pipe';
import { LocalizedDatePipe } from '@app/pipes/localized-date.pipe';
import { TranslatePipe } from '@app/pipes/translate.pipe';

@Component({
  standalone: true,
  imports: [AsyncPipe, LocalizedCurrencyPipe, LocalizedDatePipe, LucideDynamicIcon, RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './product-detail.component.html',
})
export class ProductDetailComponent {
  readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  private readonly products = inject(ProductsService);
  readonly product$ = inject(ActivatedRoute).paramMap.pipe(switchMap((params) => this.products.get(Number(params.get('id')))));
}
