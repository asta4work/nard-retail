import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { QueryParams } from '@app/types';

export function toHttpParams(query: QueryParams): HttpParams {
  return Object.entries(query).reduce((params, [key, value]) => {
    return value === undefined || value === null || value === ''
      ? params
      : params.set(key, value);
  }, new HttpParams());
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  const message = error.error?.message;
  return Array.isArray(message) ? message.join(', ') : message || fallback;
}
