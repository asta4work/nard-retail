import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, shareReplay } from 'rxjs';
import { environment } from '@env/environment';
import { InventoryReport, SalesReport } from '@app/models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private cache?: Observable<{ sales: SalesReport; inventory: InventoryReport }>;

  constructor(private readonly http: HttpClient) {}

  load() {
    this.cache ??= forkJoin({
      sales: this.http.get<SalesReport>(`${environment.apiUrl}/reports/sales`),
      inventory: this.http.get<InventoryReport>(`${environment.apiUrl}/reports/inventory`),
    }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    return this.cache;
  }

  invalidate() {
    this.cache = undefined;
  }
}
