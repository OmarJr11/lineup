import type { NotificationTypeEnum } from '../../../common/enums/notification-type.enum';
import type { INotificationPayload } from '../../../common/interfaces/notification-payload.interface';

/**
 * Payload broadcast over Socket.IO for a notification (persisted or ephemeral).
 */
export interface INotificationRealtimePayload {
  readonly id?: number;
  readonly type: NotificationTypeEnum;
  readonly title: string;
  readonly body: string;
  readonly payload?: INotificationPayload | null;
  readonly idUser: number;
  readonly idBusiness?: number | null;
  readonly readAt?: Date | null;
  readonly creationDate?: Date;
  readonly ephemeral?: boolean;
}
