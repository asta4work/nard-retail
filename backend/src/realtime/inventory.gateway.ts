import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';

export interface StockUpdate {
  productId: number;
  stockQuantity: number;
}

export interface ProductChange {
  action: 'created' | 'updated' | 'deleted';
  productId: number;
}

@WebSocketGateway({ namespace: '/inventory', cors: { origin: '*' } })
export class InventoryGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(InventoryGateway.name);

  @WebSocketServer()
  server: Namespace;

  afterInit() {
    this.logger.log('Inventory Socket.IO namespace initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Inventory client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Inventory client disconnected: ${client.id}`);
  }

  broadcastStock(updates: StockUpdate[]) {
    if (!updates.length) return;
    this.server.emit('stock.updated', updates);
    this.logger.debug(`Broadcast stock update for ${updates.length} product(s)`);
  }

  broadcastProductChange(change: ProductChange) {
    this.server.emit('product.changed', change);
    this.logger.debug(`Broadcast product ${change.action}: ${change.productId}`);
  }
}
