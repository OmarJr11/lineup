import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import {
  NOTIFICATION_SOCKET_EVENT,
  NOTIFICATION_SOCKET_NAMESPACE,
  NOTIFICATION_SOCKET_SUBSCRIBE_MESSAGE,
} from '../../common/constants/notifications.constants';
import { Notification } from '../../entities';
import type { INotificationSocketSubscribePayload } from '../../common/interfaces';
import { NotificationSocketSubscribeType } from '../../common/enums';

/**
 * Socket.IO gateway for pushing {@link Notification} entities to subscribed clients.
 */
@WebSocketGateway({
  namespace: NOTIFICATION_SOCKET_NAMESPACE,
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway {
  private readonly logger: Logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  private readonly server: Server;

  /**
   * Called after the server is initialized.
   *
   * @param {Server} _server - The server instance
   * @returns {void}
   */
  afterInit(_server: Server): void {
    this.logger.log('Notifications gateway initialized');
  }

  /**
   * Joins the socket to `notifications/user/:id` or `notifications/business/:id`.
   *
   * @param {Socket} client - Connected socket instance
   * @param {unknown} body - Client message body ({@link INotificationSocketSubscribePayload})
   * @returns {void}
   */
  @SubscribeMessage(NOTIFICATION_SOCKET_SUBSCRIBE_MESSAGE)
  handleRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): void {
    const payload: INotificationSocketSubscribePayload | null =
      this.parseSubscribePayload(body);
    if (payload === null) {
      this.logger.warn(
        `Invalid notification subscribe payload: ${JSON.stringify(body)}`,
      );
      return;
    }
    const roomName: string =
      payload.type === NotificationSocketSubscribeType.Business
        ? this.roomNameForBusiness(payload.id)
        : this.roomNameForUser(payload.id);
    void client.join(roomName);
    this.logger.log(`Connected to room notification ${roomName}`);
  }

  /**
   * Parses and validates the subscribe message body.
   *
   * @param {unknown} body - Raw Socket.IO message body
   * @returns {INotificationSocketSubscribePayload | null} Parsed payload or null if invalid
   */
  private parseSubscribePayload(
    body: unknown,
  ): INotificationSocketSubscribePayload | null {
    if (typeof body !== 'object' || body === null) {
      return null;
    }
    const record: Record<string, unknown> = body as Record<string, unknown>;
    const typeRaw: unknown = record.type;
    const idRaw: unknown = record.id;
    if (
      typeRaw !== NotificationSocketSubscribeType.User &&
      typeRaw !== NotificationSocketSubscribeType.Business
    ) {
      return null;
    }
    const id: number =
      typeof idRaw === 'number'
        ? idRaw
        : typeof idRaw === 'string'
          ? Number(idRaw)
          : NaN;
    if (!Number.isInteger(id) || id < 1) {
      return null;
    }
    return { type: typeRaw, id };
  }

  /**
   * Emits a notification payload to every socket in the user's room.
   *
   * @param {number} userId - Recipient user id
   * @param {Notification} notification - Notification entity
   * @returns {void}
   */
  emitToUser(userId: number, notification: Notification): void {
    if (!this.server) {
      this.logger.warn('Socket server not initialized; skip emit');
      return;
    }
    this.server
      .to(this.roomNameForUser(userId))
      .emit(NOTIFICATION_SOCKET_EVENT, notification);
  }

  /**
   * Emits a notification payload to every socket in the business's room.
   *
   * @param {number} businessId - Recipient business id
   * @param {Notification} notification - Notification entity
   * @returns {void}
   */
  emitToBusiness(businessId: number, notification: Notification): void {
    if (!this.server) {
      this.logger.warn('Socket server not initialized; skip emit');
      return;
    }
    this.server
      .to(this.roomNameForBusiness(businessId))
      .emit(NOTIFICATION_SOCKET_EVENT, notification);
  }

  /**
   * Builds the Socket.IO room name for a user.
   *
   * @param {number} userId - User primary key
   * @returns {string} Room name
   */
  roomNameForUser(userId: number): string {
    return `notifications/user/${userId}`;
  }

  /**
   * Builds the Socket.IO room name for a business.
   *
   * @param {number} businessId - Business primary key
   * @returns {string} Room name
   */
  roomNameForBusiness(businessId: number): string {
    return `notifications/business/${businessId}`;
  }
}
