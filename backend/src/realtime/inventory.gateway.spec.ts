import { Namespace } from 'socket.io';
import { InventoryGateway } from './inventory.gateway';

describe('InventoryGateway', () => {
  let gateway: InventoryGateway;
  let emit: jest.Mock;

  beforeEach(() => {
    gateway = new InventoryGateway();
    emit = jest.fn();
    gateway.server = { emit } as unknown as Namespace;
  });

  it('broadcasts stock updates', () => {
    const updates = [{ productId: 5, stockQuantity: 2 }];

    gateway.broadcastStock(updates);

    expect(emit).toHaveBeenCalledWith('stock.updated', updates);
  });

  it('does not broadcast an empty stock update', () => {
    gateway.broadcastStock([]);

    expect(emit).not.toHaveBeenCalled();
  });

  it('broadcasts product changes', () => {
    const change = { action: 'updated' as const, productId: 5 };

    gateway.broadcastProductChange(change);

    expect(emit).toHaveBeenCalledWith('product.changed', change);
  });

  it('handles gateway lifecycle events', () => {
    const logger = (gateway as unknown as { logger: { log: jest.Mock } }).logger;
    jest.spyOn(logger, 'log').mockImplementation();

    gateway.afterInit();
    gateway.handleConnection({ id: 'connected' } as never);
    gateway.handleDisconnect({ id: 'disconnected' } as never);

    expect(logger.log).toHaveBeenCalledTimes(3);
  });
});
