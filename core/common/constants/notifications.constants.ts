/**
 * Socket.IO event name for realtime notification payloads.
 */
export const NOTIFICATION_SOCKET_EVENT = 'notification' as const;

/**
 * Socket.IO event clients emit to join a notification room (`notifications/user/:id` or `notifications/business/:id`).
 */
export const NOTIFICATION_SOCKET_SUBSCRIBE_MESSAGE = 'notifications' as const;

/**
 * Socket.IO namespace for authenticated user notification streams.
 */
export const NOTIFICATION_SOCKET_NAMESPACE = '/notifications-socket' as const;
