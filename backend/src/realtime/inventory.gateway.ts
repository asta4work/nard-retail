import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Namespace } from 'socket.io';

export interface StockUpdate {
  productId: number;
  stockQuantity: number;
}

export interface ProductChange {
  action: 'created' | 'updated' | 'deleted';
  productId: number;
}

@WebSocketGateway({ namespace: '/inventory', cors: { origin: '*' } })
export class InventoryGateway {
  @WebSocketServer()
  server: Namespace;

  broadcastStock(updates: StockUpdate[]) {
    if (updates.length) this.server?.emit('stock.updated', updates);
  }

  broadcastProductChange(change: ProductChange) {
    this.server?.emit('product.changed', change);
  }
}
