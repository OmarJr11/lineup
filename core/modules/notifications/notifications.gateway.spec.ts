import type { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { UsersGettersService } from '../users/users.getters.service';
import { Notification } from '../../entities';
import {
  NOTIFICATION_SOCKET_EVENT,
} from '../../common/constants/notifications.constants';

/**
 * Unit tests for {@link NotificationsGateway}.
 */
describe('NotificationsGateway', () => {
  const jwtServiceMock = {
    verifyAsync: jest.fn(),
  };
  const usersGettersServiceMock = {};
  let gateway: NotificationsGateway;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new NotificationsGateway(
      jwtServiceMock as unknown as JwtService,
      usersGettersServiceMock as unknown as UsersGettersService,
    );
  });

  describe('roomNameForUser', () => {
    it('returns user room prefix', () => {
      expect(gateway.roomNameForUser(42)).toBe('user:42');
    });
  });

  describe('roomNameForBusiness', () => {
    it('returns business room prefix', () => {
      expect(gateway.roomNameForBusiness(7)).toBe('business:7');
    });
  });

  describe('emitToUser', () => {
    it('no-ops when server is not initialized', () => {
      const notification = { id: 1 } as Notification;
      expect(() => gateway.emitToUser(1, notification)).not.toThrow();
    });
    it('emits to user room when server exists', () => {
      const emit = jest.fn();
      const to = jest.fn().mockReturnValue({ emit });
      (gateway as unknown as { server: { to: typeof to } }).server = {
        to,
      };
      const notification = { id: 2 } as Notification;
      gateway.emitToUser(5, notification);
      expect(to).toHaveBeenCalledWith('user:5');
      expect(emit).toHaveBeenCalledWith(
        NOTIFICATION_SOCKET_EVENT,
        notification,
      );
    });
  });

  describe('handleConnection', () => {
    it('disconnects when token is missing', async () => {
      const disconnect = jest.fn();
      const client = {
        handshake: { query: {} },
        disconnect,
      } as unknown as Socket;
      await gateway.handleConnection(client);
      expect(disconnect).toHaveBeenCalledWith(true);
    });
    it('joins user room for non-business JWT', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 100,
        isBusiness: false,
      });
      const join = jest.fn();
      const disconnect = jest.fn();
      const client = {
        handshake: { query: { token: 'jwt-here' } },
        join,
        disconnect,
        data: {},
      } as unknown as Socket;
      await gateway.handleConnection(client);
      expect(join).toHaveBeenCalledWith('user:100');
      expect(disconnect).not.toHaveBeenCalled();
    });
    it('joins business room when isBusiness is true', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({
        sub: 55,
        isBusiness: true,
      });
      const join = jest.fn();
      const disconnect = jest.fn();
      const client = {
        handshake: { query: { token: 'jwt-b' } },
        join,
        disconnect,
        data: {},
      } as unknown as Socket;
      await gateway.handleConnection(client);
      expect(join).toHaveBeenCalledWith('business:55');
    });
    it('disconnects when JWT verification fails', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid'));
      const disconnect = jest.fn();
      const client = {
        handshake: { query: { token: 'bad' } },
        disconnect,
      } as unknown as Socket;
      await gateway.handleConnection(client);
      expect(disconnect).toHaveBeenCalledWith(true);
    });
  });
});
