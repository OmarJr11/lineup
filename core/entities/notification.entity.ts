import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { NotificationTypeEnum } from '../common/enums';
import type { INotificationPayload } from '../common/interfaces/notification-payload.interface';
import { Business, User } from '.';

/**
 * Persisted in-app notification for a user, optionally scoped to a business context.
 */
@Entity({ schema: 'system', name: 'notifications' })
export class Notification extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @Column({ type: 'enum', enum: NotificationTypeEnum })
  type: NotificationTypeEnum;

  @Column('character varying', { length: 255 })
  title: string;

  @Column('text')
  body: string;

  @Column('jsonb', { nullable: true })
  payload?: INotificationPayload;

  @Column('int8', { name: 'id_creation_user', nullable: true })
  idCreationUser?: number;

  @ManyToOne(() => User, (user: User) => user.notifications)
  @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
  user: User;

  @Column('int8', { name: 'id_creation_business', nullable: true })
  idCreationBusiness?: number;

  @ManyToOne(
    () => Business,
    (business: Business): Notification[] => business.notifications,
  )
  @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
  business?: Business;

  @Column('timestamp with time zone', { name: 'read_at', nullable: true })
  readAt?: Date;
}
