import { EMPTY, Observable, catchError, finalize, of, tap } from 'rxjs';
import { emptyPage, Page } from '@app/models';
import { getErrorMessage } from './http.utils';

export interface RequestState {
  setError: (message: string) => void;
  setLoading: (loading: boolean) => void;
}

export function handleRequest<T>(
  request: Observable<T>,
  fallbackMessage: string,
  state: RequestState,
): Observable<T> {
  return runRequest(request, fallbackMessage, state, () => EMPTY);
}

export function handlePageRequest<T>(
  request: Observable<Page<T>>,
  fallbackMessage: string,
  state: RequestState,
): Observable<Page<T>> {
  return runRequest(request, fallbackMessage, state, () => of(emptyPage<T>()));
}

function runRequest<T>(
  request: Observable<T>,
  fallbackMessage: string,
  state: RequestState,
  recover: () => Observable<T>,
): Observable<T> {
  state.setLoading(true);
  state.setError('');

  return request.pipe(
    tap(() => state.setLoading(false)),
    catchError((error) => {
      state.setError(getErrorMessage(error, fallbackMessage));
      return recover();
    }),
    finalize(() => state.setLoading(false)),
  );
}
