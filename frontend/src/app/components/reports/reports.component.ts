import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { getErrorMessage } from '@app/utils/http.utils';
import { InventoryReport, SalesReport } from '@app/models';
import { ReportsService } from '@app/services/reports.service';

@Component({
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
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
