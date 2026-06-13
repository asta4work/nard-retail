import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { User } from '@app/models';
import { CreateUserPayload, UpdateUserPayload } from '@app/types';
import { Observable, shareReplay, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private cache?: Observable<User[]>;

  constructor(private readonly http: HttpClient) {}

  list() {
    this.cache ??= this.http.get<User[]>(`${environment.apiUrl}/users`)
      .pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.cache;
  }

  create(payload: CreateUserPayload) {
    return this.http.post<User>(`${environment.apiUrl}/users`, payload).pipe(tap(() => this.invalidate()));
  }

  update(id: number, payload: UpdateUserPayload) {
    return this.http.patch<User>(`${environment.apiUrl}/users/${id}`, payload).pipe(tap(() => this.invalidate()));
  }

  private invalidate() {
    this.cache = undefined;
  }
}
