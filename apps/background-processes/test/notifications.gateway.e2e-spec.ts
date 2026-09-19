import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { io, Socket as ClientSocket } from 'socket.io-client';
import { NotificationsRealtimeModule } from '../../../core/modules/notifications/notifications-realtime.module';
import { NotificationsGateway } from '../../../core/modules/notifications/notifications.gateway';
import {
  NOTIFICATION_SOCKET_EVENT,
  NOTIFICATION_SOCKET_NAMESPACE,
  NOTIFICATION_SOCKET_SUBSCRIBE_MESSAGE,
} from '../../../core/common/constants/notifications.constants';
import { NotificationSocketSubscribeType, NotificationTypeEnum } from '../../../core/common/enums';
import type { Notification } from '../../../core/entities';

/**
 * E2E integration test for {@link NotificationsGateway} over real Socket.IO connections.
 */
describe('NotificationsGateway (E2E)', () => {
  let app: INestApplication;
  let gateway: NotificationsGateway;
  let clientSocket: ClientSocket;
  let port: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [NotificationsRealtimeModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0);

    const address = app.getHttpServer().address();
    port = typeof address === 'object' && address !== null ? address.port : 3003;
    gateway = app.get(NotificationsGateway);
  });

  afterAll(async () => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  it('connects to /notifications namespace, subscribes to user room, and receives emitted notifications', (done) => {
    const userId = 77;
    const mockNotification = {
      id: 1,
      type: NotificationTypeEnum.INFO,
      title: 'Nuevo pedido',
      body: 'Tu pedido ha sido recibido',
      idCreationUser: userId,
    } as unknown as Notification;

    clientSocket = io(`http://localhost:${port}${NOTIFICATION_SOCKET_NAMESPACE}`, {
      transports: ['websocket'],
      forceNew: true,
    });

    clientSocket.on('connect', () => {
      clientSocket.emit(NOTIFICATION_SOCKET_SUBSCRIBE_MESSAGE, {
        type: NotificationSocketSubscribeType.User,
        id: userId,
      });

      // Allow gateway to process room join then emit notification
      setTimeout(() => {
        gateway.emitToUser(userId, mockNotification);
      }, 50);
    });

    clientSocket.on(NOTIFICATION_SOCKET_EVENT, (data: Notification) => {
      try {
        expect(data).toBeDefined();
        expect(data.id).toBe(mockNotification.id);
        expect(data.title).toBe(mockNotification.title);
        expect(data.body).toBe(mockNotification.body);
        clientSocket.disconnect();
        done();
      } catch (error) {
        clientSocket.disconnect();
        done(error);
      }
    });

    clientSocket.on('connect_error', (err) => {
      done(err);
    });
  });

  it('subscribes to business room and receives business notifications', (done) => {
    const businessId = 88;
    const mockNotification = {
      id: 2,
      type: NotificationTypeEnum.INFO,
      title: 'Nueva venta',
      body: 'Has realizado una venta',
      idCreationBusiness: businessId,
    } as unknown as Notification;

    const socket = io(`http://localhost:${port}${NOTIFICATION_SOCKET_NAMESPACE}`, {
      transports: ['websocket'],
      forceNew: true,
    });

    socket.on('connect', () => {
      socket.emit(NOTIFICATION_SOCKET_SUBSCRIBE_MESSAGE, {
        type: NotificationSocketSubscribeType.Business,
        id: businessId,
      });

      setTimeout(() => {
        gateway.emitToBusiness(businessId, mockNotification);
      }, 50);
    });

    socket.on(NOTIFICATION_SOCKET_EVENT, (data: Notification) => {
      try {
        expect(data).toBeDefined();
        expect(data.id).toBe(mockNotification.id);
        expect(data.title).toBe(mockNotification.title);
        expect(data.body).toBe(mockNotification.body);
        socket.disconnect();
        done();
      } catch (error) {
        socket.disconnect();
        done(error);
      }
    });
  });
});
