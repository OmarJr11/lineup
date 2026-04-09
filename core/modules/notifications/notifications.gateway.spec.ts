import type { Server, Socket } from 'socket.io';
import { NotificationsGateway } from './notifications.gateway';
import { Notification } from '../../entities';
import {
  NOTIFICATION_SOCKET_EVENT,
} from '../../common/constants/notifications.constants';
import { NotificationSocketSubscribeType } from '../../common/enums';

/**
 * Unit tests for {@link NotificationsGateway}.
 */
describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new NotificationsGateway();
  });

  describe('afterInit', () => {
    it('runs without throwing', () => {
      expect(() =>
        gateway.afterInit({} as unknown as Server),
      ).not.toThrow();
    });
  });

  describe('roomNameForUser', () => {
    it('returns namespaced user room', () => {
      expect(gateway.roomNameForUser(42)).toBe('notifications/user/42');
    });
  });

  describe('roomNameForBusiness', () => {
    it('returns namespaced business room', () => {
      expect(gateway.roomNameForBusiness(7)).toBe(
        'notifications/business/7',
      );
    });
  });

  describe('emitToUser', () => {
    it('no-ops when server is not initialized', () => {
      const notification = { id: 1 } as Notification;
      expect(() => gateway.emitToUser(1, notification)).not.toThrow();
    });
    it('emits to the user room when server exists', () => {
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      (gateway as unknown as { server: { to: typeof to } }).server = {
        to,
      };
      const notification = { id: 2 } as Notification;
      gateway.emitToUser(5, notification);
      expect(to).toHaveBeenCalledWith('notifications/user/5');
      expect(emit).toHaveBeenCalledWith(
        NOTIFICATION_SOCKET_EVENT,
        notification,
      );
    });
  });

  describe('emitToBusiness', () => {
    it('emits to the business room when server exists', () => {
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      (gateway as unknown as { server: { to: typeof to } }).server = {
        to,
      };
      const notification = { id: 3 } as Notification;
      gateway.emitToBusiness(9, notification);
      expect(to).toHaveBeenCalledWith('notifications/business/9');
      expect(emit).toHaveBeenCalledWith(
        NOTIFICATION_SOCKET_EVENT,
        notification,
      );
    });
  });

  describe('handleRoomJoin', () => {
    it('does not join when payload is invalid', () => {
      const join = jest.fn();
      const client = { join } as unknown as Socket;
      gateway.handleRoomJoin(client, null);
      gateway.handleRoomJoin(client, { type: 'other', id: 1 });
      gateway.handleRoomJoin(client, {
        type: NotificationSocketSubscribeType.User,
        id: 0,
      });
      expect(join).not.toHaveBeenCalled();
    });
    it('joins user room for valid user subscribe payload', () => {
      const join = jest.fn().mockResolvedValue(undefined);
      const client = { join } as unknown as Socket;
      gateway.handleRoomJoin(client, {
        type: NotificationSocketSubscribeType.User,
        id: 100,
      });
      expect(join).toHaveBeenCalledWith('notifications/user/100');
    });
    it('joins business room for valid business subscribe payload', () => {
      const join = jest.fn().mockResolvedValue(undefined);
      const client = { join } as unknown as Socket;
      gateway.handleRoomJoin(client, {
        type: NotificationSocketSubscribeType.Business,
        id: 55,
      });
      expect(join).toHaveBeenCalledWith('notifications/business/55');
    });
    it('accepts numeric id as string', () => {
      const join = jest.fn().mockResolvedValue(undefined);
      const client = { join } as unknown as Socket;
      gateway.handleRoomJoin(client, {
        type: NotificationSocketSubscribeType.User,
        id: '12',
      } as never);
      expect(join).toHaveBeenCalledWith('notifications/user/12');
    });
  });
});
