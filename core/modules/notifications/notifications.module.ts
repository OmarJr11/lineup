import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Notification } from '../../entities/notification.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsGettersService } from './notifications-getters.service';
import { NotificationsSettersService } from './notifications-setters.service';
import { NotificationsService } from './notifications.service';

/**
 * Centralized notifications: persistence, validation, and Socket.IO delivery.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Notification]),
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [
    NotificationsGettersService,
    NotificationsSettersService,
    NotificationsService,
    NotificationsGateway,
  ],
  exports: [
    NotificationsGettersService,
    NotificationsSettersService,
    NotificationsService,
    NotificationsGateway,
  ],
})
export class NotificationsModule {}
