import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { getErrorMessage } from '@app/utils/http.utils';
import { InventoryReport, SalesReport } from '@app/models';
import { ReportsService } from '@app/services/reports.service';
import { LocalizedCurrencyPipe } from '@app/pipes/localized-currency.pipe';
import { LocalizedNumberPipe } from '@app/pipes/localized-number.pipe';
import { TranslatePipe } from '@app/pipes/translate.pipe';
import { I18nService } from '@app/services/i18n.service';

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
  private readonly i18n = inject(I18nService);

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

  trendDate(value: string) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat(this.i18n.locale, {
      calendar: 'gregory',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  trendTitle(date: string, total: string) {
    const amount = new Intl.NumberFormat(this.i18n.locale, { style: 'currency', currency: 'USD' }).format(Number(total));
    return `${this.trendDate(date)}: ${amount}`;
  }

  showTrendLabel(index: number, count: number) {
    return index === 0 || index === count - 1 || index % 5 === 0;
  }
}
