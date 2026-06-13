import { ChangeDetectionStrategy, Component, ElementRef, Input, inject } from '@angular/core';
import { Sale } from '@app/models';
import { LocalizedCurrencyPipe } from '@app/pipes/localized-currency.pipe';
import { LocalizedDatePipe } from '@app/pipes/localized-date.pipe';
import { TranslatePipe } from '@app/pipes/translate.pipe';
import { printElement } from '@app/utils/browser.utils';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [LocalizedCurrencyPipe, LocalizedDatePipe, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invoice.component.html',
})
export class InvoiceComponent {
  @Input({ required: true }) invoice!: Sale;
  @Input() showActions = true;
  private readonly element = inject(ElementRef<HTMLElement>);

  print() {
    const invoice = (this.element.nativeElement as HTMLElement).querySelector<HTMLElement>('.invoice-document');
    if (invoice) printElement(invoice);
  }
}
