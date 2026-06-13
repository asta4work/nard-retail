import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from '@env/environment';

export interface StockUpdate { productId: number; stockQuantity: number; }
export interface ProductChange { action: 'created' | 'updated' | 'deleted'; productId: number; }

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly stockSubject = new Subject<StockUpdate[]>();
  private readonly productSubject = new Subject<ProductChange>();
  private readonly socket = io(`${environment.socketUrl}/inventory`, {
    autoConnect: false,
    reconnection: true,
  });
  readonly stockUpdates$ = this.stockSubject.asObservable();
  readonly productChanges$ = this.productSubject.asObservable();

  constructor() {
    this.socket.on('stock.updated', (updates: StockUpdate[]) => this.stockSubject.next(updates));
    this.socket.on('product.changed', (change: ProductChange) => this.productSubject.next(change));
  }

  connect() {
    if (!this.socket.connected) this.socket.connect();
  }

  disconnect() { this.socket.disconnect(); }
}
