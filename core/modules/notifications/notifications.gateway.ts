import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { StatusEnum } from '../../common/enums';
import { UsersGettersService } from '../users/users.getters.service';
import {
  NOTIFICATION_SOCKET_EVENT,
  NOTIFICATION_SOCKET_NAMESPACE,
} from '../../common/constants/notifications.constants';
import type { INotificationRealtimePayload } from './interfaces/notification-realtime-payload.interface';

/**
 * Authenticated Socket.IO namespace that targets users by id (`user:{id}` rooms).
 */
@WebSocketGateway({
  namespace: NOTIFICATION_SOCKET_NAMESPACE,
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway implements OnGatewayConnection {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  private readonly server: Server;

  /**
   * @param {JwtService} jwtService - Verifies the same JWT as HTTP GraphQL
   * @param {UsersGettersService} usersGettersService - Ensures the subject user is active
   */
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersGettersService: UsersGettersService,
  ) {}

  /**
   * Verifies the handshake token and joins the socket to the user room.
   * @param {Socket} client - Connected socket instance
   */
  async handleConnection(client: Socket) {
    const rawToken = client.handshake.query?.token;
    const token = typeof rawToken === 'string' ? rawToken : undefined;
    if (!token) {
      this.logger.warn('Missing token on notification socket connection');
      client.disconnect(true);
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: number | string;
        username: string;
      }>(token);
      const userId = Number(payload.sub);
      await this.usersGettersService.findOneWithOptionsOrFail({
        where: { id: userId, status: StatusEnum.ACTIVE },
      });
      const room = this.roomNameForUser(userId);
      await client.join(room);
      const data = client.data as { userId?: number };
      data.userId = userId;
    } catch (err) {
      this.logger.warn(
        `Notification socket rejected: ${err instanceof Error ? err.message : String(err)}`,
      );
      client.disconnect(true);
    }
  }

  /**
   * Emits a notification payload to every socket in the user's room.
   *
   * @param {number} userId - Recipient user id
   * @param {INotificationRealtimePayload} payload - Serializable payload
   * @returns {void}
   */
  emitToUser(userId: number, payload: INotificationRealtimePayload): void {
    if (!this.server) {
      this.logger.warn('Socket server not initialized; skip emit');
      return;
    }
    this.server
      .to(this.roomNameForUser(userId))
      .emit(NOTIFICATION_SOCKET_EVENT, payload);
  }

  /**
   * Builds the Socket.IO room name for a user.
   *
   * @param {number} userId - User primary key
   * @returns {string} Room name
   */
  roomNameForUser(userId: number): string {
    return `user:${userId}`;
  }
}
