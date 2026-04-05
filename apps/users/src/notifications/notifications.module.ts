import { Module } from '@nestjs/common';
import { NotificationsModule as NotificationsCoreModule } from '../../../../core/modules/notifications/notifications.module';
import { NotificationsResolver } from './notifications.resolver';

/**
 * GraphQL wiring for the notifications feature (users API).
 */
@Module({
  imports: [NotificationsCoreModule],
  providers: [NotificationsResolver],
})
export class NotificationsModule {}
