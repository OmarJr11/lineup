import type { NotificationSocketSubscribeType } from '../../common/enums';

/**
 * Body for the `notifications` subscribe message: join `notifications/{type}/{id}`.
 */
export interface INotificationSocketSubscribePayload {
  readonly type: NotificationSocketSubscribeType;
  readonly id: number;
}
