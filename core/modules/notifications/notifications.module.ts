import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Notification } from '../../entities/notification.entity';
import { NotificationsGettersService } from './notifications-getters.service';
import { NotificationsSettersService } from './notifications-setters.service';
import { NotificationsService } from './notifications.service';

/**
 * Centralized notifications: persistence and validation. Realtime Socket.IO lives in
 * {@link NotificationsRealtimeModule} (background-processes only).
 */
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Notification])],
  providers: [
    NotificationsGettersService,
    NotificationsSettersService,
    NotificationsService,
  ],
  exports: [
    NotificationsGettersService,
    NotificationsSettersService,
    NotificationsService,
  ],
})
export class NotificationsModule {}
