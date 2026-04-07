import {
  Injectable,
  InternalServerErrorException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsGettersService } from './notifications-getters.service';
import { CreateNotificationParams } from './dto/create-notification.params';
import { notificationResponses } from '../../common/responses';
import { BasicService } from '../../common/services/base.service';
import { IUserOrBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers';
import { Transactional } from 'typeorm-transactional-cls-hooked';

/**
 * Write-side operations and realtime delivery for notifications.
 */
@Injectable()
export class NotificationsSettersService extends BasicService<Notification> {
  private readonly logger = new Logger(NotificationsSettersService.name);
  private readonly rMarkRead = notificationResponses.markRead;
  private readonly rCreate = notificationResponses.create;

  /**
   * @param {Repository<Notification>} notificationRepository - TypeORM repository
   * @param {NotificationsGateway | undefined} notificationsGateway - Present only in background-processes
   * @param {NotificationsGettersService} notificationsGettersService - Read helpers
   */
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Optional()
    private readonly notificationsGateway: NotificationsGateway | undefined,
    private readonly notificationsGettersService: NotificationsGettersService,
  ) {
    super(notificationRepository);
  }

  /**
   * Validates params, stores the row, and emits to connected clients.
   *
   * @param {CreateNotificationParams} params - Creation parameters
   * @param {IUserOrBusinessReq} userOrBusinessReq - User or business making the request
   * @returns {Promise<Notification>} Saved entity
   */
  @Transactional()
  async createAndDispatch(
    params: CreateNotificationParams,
    userOrBusinessReq: IUserOrBusinessReq,
  ): Promise<Notification> {
    try {
      const saved = await this.save(params, userOrBusinessReq);
      const notification = await this.notificationsGettersService.findOne(
        saved.id,
      );
      if (params.idUser) {
        this.emitRealtimePayloadToUser(params.idUser, notification);
      }
      if (params.idBusiness) {
        this.emitRealtimePayloadToBusiness(params.idBusiness, notification);
      }
      return notification;
    } catch (error) {
      LogError(
        this.logger,
        error as Error,
        this.createAndDispatch.name,
        userOrBusinessReq,
      );
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }

  /**
   * Marks a single notification as read if it belongs to the user.
   *
   * @param {number} idUser - User id
   * @param {number} idNotification - Notification id
   * @returns {Promise<Notification>} Updated row
   */
  @Transactional()
  async markAsReadForUser(
    idUser: number,
    idNotification: number,
    userOrBusinessReq: IUserOrBusinessReq,
  ): Promise<Notification> {
    const row: Notification =
      await this.notificationsGettersService.findOneForUserOrFail(
        idUser,
        idNotification,
      );

    try {
      return (await this.updateEntity(
        { readAt: new Date() },
        row,
        userOrBusinessReq,
      )) as Notification;
    } catch (error) {
      LogError(
        this.logger,
        error as Error,
        this.markAsReadForUser.name,
        userOrBusinessReq,
      );
      throw new InternalServerErrorException(this.rMarkRead.error);
    }
  }

  /**
   * Marks every unread notification as read for the user.
   *
   * @param {number} idUser - Owner user id
   * @param {IUserOrBusinessReq} userOrBusinessReq - User or business making the request
   */
  @Transactional()
  async markAllAsReadForUser(
    idUser: number,
    userOrBusinessReq: IUserOrBusinessReq,
  ) {
    const rows: Notification[] =
      await this.notificationsGettersService.findAllForUser(idUser);
    try {
      await this.updateEntity({ readAt: new Date() }, rows, userOrBusinessReq);
    } catch (error) {
      LogError(
        this.logger,
        error as Error,
        this.markAllAsReadForUser.name,
        userOrBusinessReq,
      );
    }
  }

  /**
   * Marks a single business-scoped notification as read.
   *
   * @param {number} idBusiness - Business primary key
   * @param {number} idNotification - Notification id
   * @returns {Promise<Notification>} Updated row
   */
  @Transactional()
  async markAsReadForBusiness(
    idBusiness: number,
    idNotification: number,
    userOrBusinessReq: IUserOrBusinessReq,
  ): Promise<Notification> {
    const row: Notification =
      await this.notificationsGettersService.findOneForBusinessOrFail(
        idBusiness,
        idNotification,
      );
    try {
      return (await this.updateEntity(
        { readAt: new Date() },
        row,
        userOrBusinessReq,
      )) as Notification;
    } catch (error) {
      LogError(
        this.logger,
        error as Error,
        this.markAsReadForBusiness.name,
        userOrBusinessReq,
      );
      throw new InternalServerErrorException(this.rMarkRead.error);
    }
  }

  /**
   * Marks every unread business inbox notification as read.
   * @param {number} idBusiness - Business primary key
   * @param {IUserOrBusinessReq} userOrBusinessReq - User or business making the request
   */
  @Transactional()
  async markAllAsReadForBusiness(
    idBusiness: number,
    userOrBusinessReq: IUserOrBusinessReq,
  ) {
    const rows: Notification[] =
      await this.notificationsGettersService.findAllForBusiness(idBusiness);
    try {
      await this.updateEntity({ readAt: new Date() }, rows, userOrBusinessReq);
    } catch (error) {
      LogError(
        this.logger,
        error as Error,
        this.markAllAsReadForBusiness.name,
        userOrBusinessReq,
      );
    }
  }

  /**
   * Emits a realtime payload to a user.
   *
   * @param {number} idUser - User id
   * @param {Notification} notification - Notification entity
   */
  private emitRealtimePayloadToUser(
    idUser: number,
    notification: Notification,
  ) {
    this.notificationsGateway?.emitToUser(idUser, notification);
  }

  /**
   * Emits a realtime payload to a business.
   *
   * @param {number} idBusiness - Business id
   * @param {Notification} notification - Notification entity
   */
  private emitRealtimePayloadToBusiness(
    idBusiness: number,
    notification: Notification,
  ): void {
    this.notificationsGateway?.emitToBusiness(idBusiness, notification);
  }
}
