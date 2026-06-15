import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { io } from 'socket.io-client';
import { environment } from '@env/environment';

export interface StockUpdate { productId: number; stockQuantity: number; }
export interface ProductChange { action: 'created' | 'updated' | 'deleted'; productId: number; }
export type RealtimeConnectionState = 'connected' | 'connecting' | 'disconnected';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly stockSubject = new Subject<StockUpdate[]>();
  private readonly productSubject = new Subject<ProductChange>();
  private readonly connectionSubject = new BehaviorSubject<RealtimeConnectionState>('disconnected');
  private readonly socket = io(`${environment.socketUrl}/inventory`, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    timeout: 10_000,
    transports: ['websocket'],
  });
  readonly stockUpdates$ = this.stockSubject.asObservable();
  readonly productChanges$ = this.productSubject.asObservable();
  readonly connection$ = this.connectionSubject.asObservable();

  constructor() {
    this.socket.on('connect', () => this.connectionSubject.next('connected'));
    this.socket.on('disconnect', () => this.connectionSubject.next('disconnected'));
    this.socket.on('connect_error', () => this.connectionSubject.next('disconnected'));
    this.socket.io.on('reconnect_attempt', () => this.connectionSubject.next('connecting'));
    this.socket.on('stock.updated', (updates: StockUpdate[]) => this.stockSubject.next(updates));
    this.socket.on('product.changed', (change: ProductChange) => this.productSubject.next(change));
  }

  connect() {
    if (this.socket.connected || this.socket.active) return;
    this.connectionSubject.next('connecting');
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
    this.connectionSubject.next('disconnected');
  }
}
