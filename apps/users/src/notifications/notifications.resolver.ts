import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../core/common/guards';
import { UserDec } from '../../../../core/common/decorators';
import type { IUserReq } from '../../../../core/common/interfaces';
import { NotificationsService } from '../../../../core/modules/notifications/notifications.service';
import {
  PaginatedNotifications,
  NotificationSchema,
} from '../../../../core/schemas';
import { toNotificationSchema } from '../../../../core/common/functions';
import { InfinityScrollInput } from '../../../../core/common/dtos';
/**
 * GraphQL surface for the consumer user notification inbox (`id_creation_user`).
 */
@UsePipes(new ValidationPipe())
@Resolver(() => NotificationSchema)
export class NotificationsResolver {
  /**
   * @param {NotificationsService} notificationsService - Core notifications API
   */
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Paginated inbox for the authenticated user.
   *
   * @param {IUserReq} user - JWT user
   * @param {InfinityScrollInput} pagination - Pagination parameters
   * @returns {Promise<PaginatedNotifications>} Page of notifications
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => PaginatedNotifications, { name: 'myNotifications' })
  async myNotifications(
    @UserDec() user: IUserReq,
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ): Promise<PaginatedNotifications> {
    const result = await this.notificationsService.findPaginatedForUser(
      user.userId,
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
   * Unread count for badge display.
   *
   * @param {IUserReq} user - JWT user
   * @returns {Promise<number>} Count
   */
  @UseGuards(JwtAuthGuard)
  @Query(() => Int, { name: 'unreadNotificationsCount' })
  async unreadNotificationsCount(@UserDec() user: IUserReq): Promise<number> {
    return this.notificationsService.countUnreadForUser(user.userId);
  }

  /**
   * Marks one notification as read.
   *
   * @param {IUserReq} user - JWT user
   * @param {number} id - Notification id
   * @returns {Promise<NotificationSchema>} Updated notification
   */
  @UseGuards(JwtAuthGuard)
  @Mutation(() => NotificationSchema, { name: 'markNotificationRead' })
  async markNotificationRead(
    @Args('id', { type: () => Int }) id: number,
    @UserDec() user: IUserReq,
  ): Promise<NotificationSchema> {
    const row = await this.notificationsService.markAsReadForUser(id, user);
    return toNotificationSchema(row);
  }

  /**
   * Marks all notifications as read for the current user.
   *
   * @param {IUserReq} user - JWT user
   * @returns {Promise<boolean>} Success flag
   */
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean, { name: 'markAllNotificationsRead' })
  async markAllNotificationsRead(@UserDec() user: IUserReq): Promise<boolean> {
    await this.notificationsService.markAllAsReadForUser(user);
    return true;
  }
}
