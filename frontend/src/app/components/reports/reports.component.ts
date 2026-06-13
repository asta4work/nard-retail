import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { getErrorMessage } from '@app/utils/http.utils';
import { InventoryReport, SalesReport } from '@app/models';
import { ReportsService } from '@app/services/reports.service';
import { LocalizedCurrencyPipe } from '@app/pipes/localized-currency.pipe';
import { LocalizedNumberPipe } from '@app/pipes/localized-number.pipe';
import { TranslatePipe } from '@app/pipes/translate.pipe';

@Component({
  standalone: true,
  imports: [LocalizedCurrencyPipe, LocalizedNumberPipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
})
export class ReportsComponent {
  readonly sales = signal<SalesReport | null>(null);
  readonly inventory = signal<InventoryReport | null>(null);
  readonly error = signal('');

  constructor() {
    inject(ReportsService).load().subscribe({
      next: (reports) => {
        this.sales.set(reports.sales);
        this.inventory.set(reports.inventory);
      },
      error: (error) => this.error.set(getErrorMessage(error, 'Unable to load reports')),
    });
  }

  barHeight(total: string) {
    const max = Math.max(...(this.sales()?.daily.map((day) => Number(day.total)) ?? [1]), 1);
    return Math.max(4, Number(total) / max * 100);
  }
}
