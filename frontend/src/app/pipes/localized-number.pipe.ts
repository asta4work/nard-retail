import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '@app/services/i18n.service';

@Pipe({ name: 'appNumber', standalone: true, pure: false })
export class LocalizedNumberPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: string | number | null | undefined): string {
    return new Intl.NumberFormat(this.i18n.locale).format(Number(value ?? 0));
  }
}
