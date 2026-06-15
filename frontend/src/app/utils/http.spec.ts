import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { getErrorMessage, toHttpParams } from './http.utils';

describe('HTTP utilities', () => {
  it('converts defined query values into HTTP parameters', () => {
    const params = toHttpParams({ page: 2, search: 'coffee', category: '', minPrice: undefined });

    expect(params.get('page')).toBe('2');
    expect(params.get('search')).toBe('coffee');
    expect(params.has('category')).toBe(false);
    expect(params.has('minPrice')).toBe(false);
  });

  it('extracts API errors and falls back for unknown errors', () => {
    expect(getErrorMessage(new Error('failure'), 'Fallback')).toBe('Fallback');
    expect(getErrorMessage(new HttpErrorResponse({ error: { message: ['One', 'Two'] } }), 'Fallback')).toBe('One, Two');
    expect(getErrorMessage(new HttpErrorResponse({ error: { message: 'Invalid' } }), 'Fallback')).toBe('Invalid');
    expect(getErrorMessage(new HttpErrorResponse({ error: {} }), 'Fallback')).toBe('Fallback');
  });
});
