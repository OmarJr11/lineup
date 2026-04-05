import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../core/common/guards';
import { BusinessDec } from '../../../../core/common/decorators';
import type { IBusinessReq } from '../../../../core/common/interfaces';
import { NotificationsService } from '../../../../core/modules/notifications/notifications.service';
import {
  PaginatedNotifications,
  NotificationSchema,
} from '../../../../core/schemas';
import { toNotificationSchema } from '../../../../core/common/functions';
import { InfinityScrollInput } from '../../../../core/common/dtos';

/**
 * GraphQL surface for the business-panel notification inbox (`id_creation_business`).
 */
@UsePipes(new ValidationPipe())
@Resolver(() => NotificationSchema)
export class NotificationsResolver {
  /**
   * @param {NotificationsService} notificationsService - Core notifications API
   */
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Paginated inbox for the authenticated business.
   *
   * @param {IBusinessReq} businessReq - JWT business context
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Page size
   * @returns {Promise<PaginatedNotifications>} Page of notifications
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => PaginatedNotifications, { name: 'myBusinessNotifications' })
  async myBusinessNotifications(
    @BusinessDec() businessReq: IBusinessReq,
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ): Promise<PaginatedNotifications> {
    const result = await this.notificationsService.findPaginatedForBusiness(
      businessReq.businessId,
      pagination,
    );
    const items = result.map((row) => toNotificationSchema(row));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  /**
   * Unread count for the business inbox badge.
   *
   * @param {IBusinessReq} businessReq - JWT business context
   * @returns {Promise<number>} Count
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => Int, { name: 'unreadBusinessNotificationsCount' })
  async unreadBusinessNotificationsCount(
    @BusinessDec() businessReq: IBusinessReq,
  ): Promise<number> {
    return await this.notificationsService.countUnreadForBusiness(
      businessReq.businessId,
    );
  }

  /**
   * Marks one business-scoped notification as read.
   *
   * @param {IBusinessReq} businessReq - JWT business context
   * @param {number} id - Notification id
   * @returns {Promise<NotificationSchema>} Updated notification
   */
  @UseGuards(JwtAuthGuard)
  @Mutation(() => NotificationSchema, { name: 'markBusinessNotificationRead' })
  async markBusinessNotificationRead(
    @Args('id', { type: () => Int }) id: number,
    @BusinessDec() businessReq: IBusinessReq,
  ): Promise<NotificationSchema> {
    const row = await this.notificationsService.markAsReadForBusiness(
      id,
      businessReq,
    );
    return toNotificationSchema(row);
  }

  /**
   * Marks all business inbox notifications as read.
   *
   * @param {IBusinessReq} businessReq - JWT business context
   * @returns {Promise<boolean>} Success flag
   */
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean, { name: 'markAllBusinessNotificationsRead' })
  async markAllBusinessNotificationsRead(
    @BusinessDec() businessReq: IBusinessReq,
  ): Promise<boolean> {
    await this.notificationsService.markAllAsReadForBusiness(businessReq);
    return true;
  }
}
