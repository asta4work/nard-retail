import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, debounceTime, startWith, switchMap } from 'rxjs';
import { PaginationComponent } from '@app/components/pagination/pagination.component';
import { emptyPage, Page, Sale } from '@app/models';
import { SalesService } from '@app/services/sales.service';
import { printPage } from '@app/utils/browser.utils';
import { totalQuantity } from '@app/utils/calculations';
import { handlePageRequest } from '@app/utils/request.utils';

@Component({
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, DatePipe, PaginationComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sales.component.html',
})
export class SalesComponent {
  private readonly sales = inject(SalesService);
  private readonly fb = inject(FormBuilder);
  readonly page$ = new BehaviorSubject<Page<Sale>>(emptyPage());
  selected?: Sale;
  loading = false;
  error = '';
  readonly print = printPage;
  readonly filterDefaults = {
    search: '',
    from: '',
    to: '',
    minAmount: '',
    maxAmount: '',
    page: 1,
    limit: 20,
  };
  readonly filters = this.fb.nonNullable.group(this.filterDefaults);

  constructor() {
    this.filters.valueChanges.pipe(
      debounceTime(250),
      startWith(this.filters.getRawValue()),
      switchMap((query) => handlePageRequest(
        this.sales.list(query),
        'Unable to load sales',
        {
          setError: (error) => this.error = error,
          setLoading: (loading) => this.loading = loading,
        },
      )),
      takeUntilDestroyed(inject(DestroyRef)),
    ).subscribe((page) => this.page$.next(page));
  }

  itemCount(sale: Sale) {
    return totalQuantity(sale.items);
  }

  toggleDetails(sale: Sale) {
    this.selected = this.selected?.id === sale.id ? undefined : sale;
  }
}
