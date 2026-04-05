import type { Notification } from '../../entities/notification.entity';
import type { NotificationSchema } from '../../schemas/notification.schema';

/**
 * Maps a Notification entity to its GraphQL schema shape.
 *
 * @param {Notification} notification - Persisted notification row
 * @returns {NotificationSchema} GraphQL-ready object
 */
export function toNotificationSchema(
  notification: Notification,
): NotificationSchema {
  return notification as NotificationSchema;
}
