import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { environment } from '@env/environment';
import { AuthResponse, User } from '@app/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<User | null>(this.readUser());
  readonly user$ = this.userSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  get token() { return localStorage.getItem('access_token'); }
  get user() { return this.userSubject.value; }
  get authenticated() { return !!this.token; }
  get isAdmin() { return this.user?.role === 'admin'; }

  login(credentials: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(tap((result) => this.store(result)));
  }

  register(payload: { name: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload).pipe(tap((result) => this.store(result)));
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
  }

  private store(result: AuthResponse) {
    localStorage.setItem('access_token', result.accessToken);
    localStorage.setItem('user', JSON.stringify(result.user));
    this.userSubject.next(result.user);
  }

  private readUser(): User | null {
    try { return JSON.parse(localStorage.getItem('user') ?? 'null') as User | null; }
    catch { return null; }
  }
}
