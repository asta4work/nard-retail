import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { handlePageRequest, handleRequest } from './request.utils';

describe('request utilities', () => {
  const state = () => ({ setError: vi.fn(), setLoading: vi.fn() });

  it('updates request state for successful requests', async () => {
    const requestState = state();

    await expect(firstValueFrom(handleRequest(of('done'), 'Failed', requestState))).resolves.toBe('done');
    expect(requestState.setError).toHaveBeenCalledWith('');
    expect(requestState.setLoading).toHaveBeenNthCalledWith(1, true);
    expect(requestState.setLoading).toHaveBeenLastCalledWith(false);
  });

  it('recovers page requests with an empty page and reports API errors', async () => {
    const requestState = state();
    const error = new HttpErrorResponse({ error: { message: 'Unavailable' } });

    const result = await firstValueFrom(handlePageRequest(throwError(() => error), 'Failed', requestState));

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(requestState.setError).toHaveBeenCalledWith('Unavailable');
    expect(requestState.setLoading).toHaveBeenLastCalledWith(false);
  });

  it('completes non-page requests without emitting after errors', async () => {
    const requestState = state();
    let emitted = false;

    await new Promise<void>((resolve) => {
      handleRequest(throwError(() => new Error('failed')), 'Failed', requestState).subscribe({
        next: () => { emitted = true; },
        complete: resolve,
      });
    });

    expect(emitted).toBe(false);
    expect(requestState.setError).toHaveBeenCalledWith('Failed');
  });
});
