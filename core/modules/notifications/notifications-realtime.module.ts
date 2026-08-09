import { Global, Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

/**
 * Socket.IO for notifications: import only in `background-processes` so clients use
 * `PORT_BACKGROUND_PROCESSES` / namespace `/notifications`. Global so workers resolve the gateway.
 */
@Global()
@Module({
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class NotificationsRealtimeModule {}
