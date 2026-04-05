import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { NotificationsGettersService } from './notifications-getters.service';
import { NotificationsSettersService } from './notifications-setters.service';
import { CreateNotificationParams } from './dto/create-notification.params';
import { BasicService } from '../../common/services/base.service';
import { Request } from 'express';
import {
  IBusinessReq,
  IUserOrBusinessReq,
  IUserReq,
} from '../../common/interfaces';
import { InfinityScrollInput } from '../../common/dtos';

/**
 * Facade over notifications getters and setters for a single injection point.
 */
@Injectable({ scope: Scope.REQUEST })
export class NotificationsService extends BasicService<Notification> {
  /**
   * @param {NotificationsGettersService} notificationsGettersService - Reads
   * @param {NotificationsSettersService} notificationsSettersService - Writes and realtime
   */
  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsGettersService: NotificationsGettersService,
    private readonly notificationsSettersService: NotificationsSettersService,
  ) {
    super(notificationRepository, userRequest);
  }

  /**
   * Validates params, stores the row, and emits to connected clients.
   *
   * @param {CreateNotificationParams} params - Creation parameters
   * @param {IUserOrBusinessReq} userOrBusinessReq - User or business making the request
   * @returns {Promise<Notification>} Saved entity
   */
  async createAndDispatch(
    params: CreateNotificationParams,
    userOrBusinessReq: IUserOrBusinessReq,
  ): Promise<Notification> {
    return await this.notificationsSettersService.createAndDispatch(
      params,
      userOrBusinessReq,
    );
  }

  /**
   * Paginates notifications for the consumer user inbox (`id_creation_user`).
   *
   * @param {number} userId - User id
   * @param {InfinityScrollInput} options - Page and limit
   * @returns {Promise<Pagination<Notification>>} Page result
   */
  async findPaginatedForUser(
    userId: number,
    options: InfinityScrollInput,
  ): Promise<Notification[]> {
    return await this.notificationsGettersService.findPaginatedForUser(
      userId,
      options,
    );
  }

  /**
   * Paginates notifications for the business panel inbox (`id_creation_business`).
   *
   * @param {number} businessId - Business id
   * @param {IPaginationOptions} options - Page and limit
   * @returns {Promise<Pagination<Notification>>} Page result
   */
  async findPaginatedForBusiness(
    businessId: number,
    options: InfinityScrollInput,
  ): Promise<Notification[]> {
    return await this.notificationsGettersService.findPaginatedForBusiness(
      businessId,
      options,
    );
  }

  /**
   * Unread count for the user inbox.
   *
   * @param {number} userId - User id
   * @returns {Promise<number>} Unread count
   */
  async countUnreadForUser(userId: number): Promise<number> {
    return await this.notificationsGettersService.countUnreadForUser(userId);
  }

  /**
   * Unread count for the business inbox.
   *
   * @param {number} businessId - Business id
   * @returns {Promise<number>} Unread count
   */
  async countUnreadForBusiness(businessId: number): Promise<number> {
    return await this.notificationsGettersService.countUnreadForBusiness(
      businessId,
    );
  }

  /**
   * Marks one notification read in the user inbox.
   *
   * @param {number} idNotification - Notification id
   * @param {IUserReq} userReq - User making the request
   * @returns {Promise<Notification>} Updated row
   */
  async markAsReadForUser(
    idNotification: number,
    userReq: IUserReq,
  ): Promise<Notification> {
    return await this.notificationsSettersService.markAsReadForUser(
      userReq.userId,
      idNotification,
      userReq,
    );
  }

  /**
   * Marks one notification read in the business inbox.
   *
   * @param {number} idBusiness - Business id
   * @param {number} idNotification - Notification id
   * @returns {Promise<Notification>} Updated row
   */
  async markAsReadForBusiness(
    idNotification: number,
    businessReq: IBusinessReq,
  ): Promise<Notification> {
    return await this.notificationsSettersService.markAsReadForBusiness(
      businessReq.businessId,
      idNotification,
      businessReq,
    );
  }

  /**
   * Marks all unread notifications read for the user inbox.
   *
   * @param {IUserReq} userReq - User request
   */
  async markAllAsReadForUser(userReq: IUserReq) {
    return await this.notificationsSettersService.markAllAsReadForUser(
      userReq.userId,
      userReq,
    );
  }

  /**
   * Marks all unread notifications read for the business inbox.
   *
   * @param {IBusinessReq} businessReq - Business request
   */
  async markAllAsReadForBusiness(businessReq: IBusinessReq) {
    await this.notificationsSettersService.markAllAsReadForBusiness(
      businessReq.businessId,
      businessReq,
    );
  }
}
