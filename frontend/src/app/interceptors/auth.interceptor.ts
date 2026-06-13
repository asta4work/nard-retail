import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@app/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const authenticated = auth.token ? request.clone({ setHeaders: { Authorization: `Bearer ${auth.token}` } }) : request;
  return next(authenticated).pipe(catchError((error: { status?: number }) => {
    if (error.status === 401) {
      auth.logout();
      void router.navigate(['/login']);
    }
    return throwError(() => error);
  }));
};
