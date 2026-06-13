import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '@app/services/i18n.service';

@Pipe({ name: 'money', standalone: true, pure: false })
export class LocalizedCurrencyPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: string | number | null | undefined, currency = 'USD'): string {
    return new Intl.NumberFormat(this.i18n.locale, { style: 'currency', currency })
      .format(Number(value ?? 0));
  }
}
