import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities';
import { BasicService } from '../../common/services/base.service';
import { InfinityScrollInput } from '../../common/dtos';
import { LogError } from '../../common/helpers/logger.helper';
import { notificationResponses } from '../../common/responses';

/**
 * Read-side operations for persisted notifications.
 */
@Injectable()
export class NotificationsGettersService extends BasicService<Notification> {
  private readonly logger = new Logger(NotificationsGettersService.name);
  private readonly rList = notificationResponses.list;
  /**
   * @param {Repository<Notification>} notificationRepository - TypeORM repository
   */
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {
    super(notificationRepository);
  }

  /**
   * Paginates notifications for the given user (newest first).
   *
   * @param {number} userId - Owner user id
   * @param {IPaginationOptions} options - Page and limit
   * @returns {Promise<Pagination<Notification>>} Page result
   */
  async findPaginatedForUser(
    userId: number,
    options: InfinityScrollInput,
  ): Promise<Notification[]> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const order = options.order || 'DESC';
    const orderBy = options.orderBy || 'creation_date';
    return await this.createQueryBuilder('n')
      .leftJoinAndSelect('n.creationUser', 'creationUser')
      .leftJoinAndSelect('creationUser.profileImage', 'profileImage')
      .where('n.idCreationUser = :userId', { userId })
      .orderBy(`n.${orderBy}`, order)
      .limit(limit)
      .offset(skip)
      .getMany();
  }

  /**
   * Counts notifications with no read timestamp for the user.
   *
   * @param {number} userId - Owner user id
   * @returns {Promise<number>} Unread count
   */
  async countUnreadForUser(userId: number): Promise<number> {
    try {
      return await this.createQueryBuilder('n')
        .where('n.idCreationUser = :userId', { userId })
        .andWhere('n.readAt IS NULL')
        .getCount();
    } catch (error) {
      LogError(this.logger, error as Error, this.countUnreadForUser.name);
      throw new InternalServerErrorException(this.rList.error);
    }
  }

  /**
   * Finds a notification by its ID.
   *
   * @param {number} id - Notification primary key
   * @returns {Promise<Notification>} Notification
   */
  async findOne(id: number): Promise<Notification> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { id },
        relations: [
          'creationUser',
          'creationUser.profileImage',
          'creationBusiness',
          'creationBusiness.image',
        ],
      });
    } catch (error) {
      LogError(this.logger, error as Error, this.findOne.name);
      throw new InternalServerErrorException(this.rList.error);
    }
  }

  /**
   * Loads a notification by id when it belongs to the user.
   *
   * @param {number} userId - Owner user id
   * @param {number} notificationId - Notification primary key
   * @returns {Promise<Notification>} Row or null
   */
  async findOneForUserOrFail(
    userId: number,
    notificationId: number,
  ): Promise<Notification> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { id: notificationId, idCreationUser: userId },
        relations: ['creationUser', 'creationUser.profileImage'],
      });
    } catch (error) {
      LogError(this.logger, error as Error, this.findOneForUserOrFail.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Paginates notifications scoped to a business (newest first).
   *
   * @param {number} businessId - Business primary key
   * @param {IPaginationOptions} options - Page and limit
   * @returns {Promise<Pagination<Notification>>} Page result
   */
  async findPaginatedForBusiness(
    businessId: number,
    options: InfinityScrollInput,
  ): Promise<Notification[]> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const order = options.order || 'DESC';
    const orderBy = options.orderBy || 'creation_date';
    return await this.createQueryBuilder('n')
      .leftJoinAndSelect('n.creationBusiness', 'creationBusiness')
      .leftJoinAndSelect('creationBusiness.image', 'imageBusiness')
      .where('n.idCreationBusiness = :businessId', { businessId })
      .orderBy(`n.${orderBy}`, order)
      .limit(limit)
      .offset(skip)
      .getMany();
  }

  /**
   * Counts unread notifications for the business inbox.
   *
   * @param {number} businessId - Business primary key
   * @returns {Promise<number>} Unread count
   */
  async countUnreadForBusiness(businessId: number): Promise<number> {
    try {
      return await this.createQueryBuilder('n')
        .where('n.idCreationBusiness = :businessId', { businessId })
        .andWhere('n.readAt IS NULL')
        .getCount();
    } catch (error) {
      LogError(this.logger, error as Error, this.countUnreadForBusiness.name);
      throw new InternalServerErrorException(this.rList.error);
    }
  }

  /**
   * Loads a notification by id when it belongs to the business inbox.
   *
   * @param {number} businessId - Business primary key
   * @param {number} notificationId - Notification primary key
   * @returns {Promise<Notification>} Row or null
   */
  async findOneForBusinessOrFail(
    businessId: number,
    notificationId: number,
  ): Promise<Notification> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { id: notificationId, idCreationBusiness: businessId },
        relations: ['creationBusiness', 'creationBusiness.image'],
      });
    } catch (error) {
      LogError(this.logger, error as Error, this.findOneForBusinessOrFail.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Finds all notifications for the user.
   *
   * @param {number} userId - Owner user id
   * @returns {Promise<Notification[]>} Notifications
   */
  async findAllForUser(userId: number): Promise<Notification[]> {
    try {
      return await this.createQueryBuilder('n')
        .where('n.idCreationUser = :userId', { userId })
        .getMany();
    } catch (error) {
      LogError(this.logger, error as Error, this.findAllForUser.name);
      throw new InternalServerErrorException(this.rList.error);
    }
  }

  /**
   * Finds all notifications for the business.
   *
   * @param {number} businessId - Business primary key
   * @returns {Promise<Notification[]>} Notifications
   */
  async findAllForBusiness(businessId: number): Promise<Notification[]> {
    try {
      return await this.createQueryBuilder('n')
        .where('n.idCreationBusiness = :businessId', { businessId })
        .getMany();
    } catch (error) {
      LogError(this.logger, error as Error, this.findAllForBusiness.name);
      throw new InternalServerErrorException(this.rList.error);
    }
  }
}
