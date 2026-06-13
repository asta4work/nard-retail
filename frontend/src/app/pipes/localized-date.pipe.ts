import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '@app/services/i18n.service';

@Pipe({ name: 'appDate', standalone: true, pure: false })
export class LocalizedDatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(value: string | Date | null | undefined, style: 'medium' | 'full' | 'mediumDate' = 'medium'): string {
    if (!value) return '';
    const options: Record<typeof style, Intl.DateTimeFormatOptions> = {
      medium: { dateStyle: 'medium', timeStyle: 'short' },
      full: { dateStyle: 'full', timeStyle: 'short' },
      mediumDate: { dateStyle: 'medium' },
    };
    return new Intl.DateTimeFormat(this.i18n.locale, options[style]).format(new Date(value));
  }
}
