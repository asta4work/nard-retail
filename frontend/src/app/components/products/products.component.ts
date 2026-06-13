import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, debounceTime, startWith, switchMap } from 'rxjs';
import { PaginationComponent } from '@app/components/pagination/pagination.component';
import { emptyPage, Page, Product } from '@app/models';
import { AuthService } from '@app/services/auth.service';
import { CartService } from '@app/services/cart.service';
import { ProductsService } from '@app/services/products.service';
import { getErrorMessage } from '@app/utils/http.utils';
import { handlePageRequest } from '@app/utils/request.utils';
import { LucideDynamicIcon } from '@lucide/angular';

@Component({
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, LucideDynamicIcon, PaginationComponent, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './products.component.html',
})
export class ProductsComponent {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  private readonly products = inject(ProductsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly page$ = new BehaviorSubject<Page<Product>>(emptyPage());
  categories: string[] = [];
  loading = false;
  error = '';
  readonly filterDefaults = {
    search: '',
    category: '',
    availability: 'all',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    order: 'DESC',
    page: 1,
    limit: 20,
  };
  readonly filters = this.fb.nonNullable.group(this.filterDefaults);

  constructor() {
    this.products.categories().subscribe((categories) => this.categories = categories);
    this.filters.valueChanges.pipe(
      debounceTime(250),
      startWith(this.filters.getRawValue()),
      switchMap((query) => handlePageRequest(
        this.products.list(query),
        'Unable to load products',
        {
          setError: (error) => this.error = error,
          setLoading: (loading) => this.loading = loading,
        },
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((page) => this.page$.next(page));

  }

  remove(product: Product) {
    if (!confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    this.products.remove(product.id).subscribe({
      next: () => this.filters.patchValue({ page: 1 }),
      error: (error) => this.error = getErrorMessage(error, 'Unable to delete product'),
    });
  }
}
