import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsGettersService } from './notifications-getters.service';
import { CreateNotificationParams } from './dto/create-notification.params';
import type { INotificationRealtimePayload } from './interfaces/notification-realtime-payload.interface';
import { notificationResponses } from '../../common/responses';
import { BasicService } from '../../common/services/base.service';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { IUserOrBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers';

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
   * @param {NotificationsGateway} notificationsGateway - Socket.IO broadcaster
   * @param {NotificationsGettersService} notificationsGettersService - Read helpers
   */
  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notificationsGettersService: NotificationsGettersService,
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
    try {
      return await this.save(params, userOrBusinessReq);
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
   * Sends a realtime-only notification (no database row).
   *
   * @param {CreateNotificationParams} params - Ephemeral payload
   * @param {IUserOrBusinessReq} userOrBusinessReq - User or business making the request
   * @returns {Promise<Notification>} Saved entity
   */
  async emitEphemeral(
    params: CreateNotificationParams,
    userOrBusinessReq: IUserOrBusinessReq,
  ): Promise<Notification> {
    try {
      const saved = await this.createAndDispatch(params, userOrBusinessReq);
      this.emitRealtimePayload(this.toRealtimePayload(saved, true));
      return saved;
    } catch (error) {
      LogError(
        this.logger,
        error as Error,
        this.emitEphemeral.name,
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
   * Maps an entity to the wire payload and emits through the gateway.
   *
   * @param {INotificationRealtimePayload} payload - Payload
   * @returns {void}
   */
  private emitRealtimePayload(payload: INotificationRealtimePayload): void {
    try {
      this.notificationsGateway.emitToUser(payload.idUser, payload);
    } catch (err) {
      LogError(
        this.logger,
        err as Error,
        this.emitRealtimePayload.name,
        this.userRequest,
      );
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }

  /**
   * Maps a persisted row to the realtime DTO.
   *
   * @param {Notification} row - Entity
   * @param {boolean} ephemeral - Whether the event is ephemeral-only
   * @returns {INotificationRealtimePayload} Wire payload
   */
  private toRealtimePayload(
    row: Notification,
    ephemeral: boolean,
  ): INotificationRealtimePayload {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      payload: row.payload ?? null,
      idUser: row.idCreationUser ?? 0,
      idBusiness: row.idCreationBusiness ?? null,
      readAt: row.readAt ?? null,
      creationDate: row.creationDate,
      ephemeral,
    };
  }
}
