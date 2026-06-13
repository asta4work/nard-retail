import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { CartItem, Page, Sale } from '@app/models';
import { QueryParams } from '@app/types';
import { toHttpParams } from '@app/utils/http.utils';
import { tap } from 'rxjs';
import { ReportsService } from './reports.service';

@Injectable({ providedIn: 'root' })
export class SalesService {
  constructor(private readonly http: HttpClient, private readonly reports: ReportsService) {}

  checkout(customerName: string, items: CartItem[]) {
    return this.http.post<Sale>(`${environment.apiUrl}/sales`, {
      customerName: customerName || undefined,
      items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
    }).pipe(tap(() => this.reports.invalidate()));
  }

  list(query: QueryParams) {
    return this.http.get<Page<Sale>>(`${environment.apiUrl}/sales`, { params: toHttpParams(query) });
  }
}
