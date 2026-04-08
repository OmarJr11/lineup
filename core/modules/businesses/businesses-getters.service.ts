import {
  Injectable,
  Logger,
  NotAcceptableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository, SelectQueryBuilder } from 'typeorm';
import { StatusEnum } from '../../common/enums';
import { BasicService } from '../../common/services';
import {
  IAdminStatusCount,
  IAdminTimeSeriesStats,
  ITimePeriodFilter,
} from '../../common/interfaces';
import { Business } from '../../entities';
import { businessesResponses } from '../../common/responses';
import { LogError } from '../../common/helpers/logger.helper';
import { InfinityScrollInput } from '../../common/dtos';

@Injectable()
export class BusinessesGettersService extends BasicService<Business> {
  private logger: Logger = new Logger(BusinessesGettersService.name);
  private readonly _uList = businessesResponses.list;
  private readonly _uToken = businessesResponses.token;
  private readonly _relations = ['image', 'locations', 'businessFollowers'];

  constructor(
    @InjectRepository(Business)
    private readonly businessRepository: Repository<Business>,
  ) {
    super(businessRepository);
  }

  /**
   * Get all Businesses with pagination
   * @param {InfinityScrollInput} query - query parameters for pagination
   * @returns {Promise<Business[]>}
   */
  async findAll(query: InfinityScrollInput): Promise<Business[]> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;
    const order = query.order || 'DESC';
    const orderBy = query.orderBy || 'creation_date';
    const businesses = await this.applyBusinessPublicRelations(
      this.createQueryBuilder('b'),
    )
      .where('b.status <> :status', { status: StatusEnum.DELETED })
      .limit(limit)
      .offset(skip)
      .orderBy(`b.${orderBy}`, order)
      .getMany();
    return this.formatBusinesses(businesses);
  }

  /**
   * Get Business by ID
   * @param {number} id - business ID
   * @returns {Promise<Business>}
   */
  async findOne(id: number): Promise<Business> {
    try {
      const business = await this.applyBusinessPublicRelations(
        this.createQueryBuilder('b'),
      )
        .where('b.id = :id', { id })
        .andWhere('b.status <> :status', { status: StatusEnum.DELETED })
        .getOneOrFail();
      return this.formatBusiness(business);
    } catch (error) {
      LogError(this.logger, error as Error, this.findOne.name);
      throw new NotAcceptableException(this._uList.businessNotFound);
    }
  }

  /**
   * Get Businesses by IDs. Returns only found ones; ignores missing/deleted.
   * @param {number[]} ids - Business IDs to fetch.
   * @returns {Promise<Business[]>} Array of found businesses.
   */
  async findByIds(ids: number[]): Promise<Business[]> {
    if (!ids?.length) {
      return [];
    }
    const uniqueIds = [...new Set(ids)];
    const businesses = await this.applyBusinessPublicRelations(
      this.createQueryBuilder('b'),
    )
      .where('b.id IN (:...ids)', { ids: uniqueIds })
      .andWhere('b.status <> :status', { status: StatusEnum.DELETED })
      .getMany();
    return this.formatBusinesses(businesses);
  }

  /**
   * Find Business by path
   * @param {string} path - Business path
   * @returns {Promise<Business>}
   */
  async findOneByPath(path: string): Promise<Business> {
    try {
      const business = await this.applyBusinessPublicRelations(
        this.createQueryBuilder('b'),
      )
        .where('b.path = :path', { path: path.toLocaleLowerCase() })
        .andWhere('b.status <> :status', { status: StatusEnum.DELETED })
        .getOneOrFail();
      return this.formatBusiness(business);
    } catch (error) {
      LogError(this.logger, error as Error, this.findOneByPath.name);
      throw new NotAcceptableException(this._uList.businessNotFound);
    }
  }

  /**
   * Get Business by path
   * @param {string} path - Business path
   * @returns {Promise<Business>}
   */
  async getOneByPath(path: string): Promise<Business> {
    return await this.findOneWithOptions({
      where: {
        path: path.toLocaleLowerCase(),
        status: Not(StatusEnum.DELETED),
      },
    });
  }

  /**
   * Search Businesses by path
   * @param {string} path - Business path
   * @returns {Promise<Business[]>}
   */
  async searchBusinessesByPath(path: string): Promise<Business[]> {
    return await this.createQueryBuilder('b')
      .where('b.status <> :status', { status: StatusEnum.DELETED })
      .andWhere('b.path iLIKE :path', { path: `%${path}%` })
      .getMany();
  }

  /**
   * Find Business by ID with password (for change password flow)
   * @param {number} id - business ID
   * @returns {Promise<Business>}
   */
  async findOneByIdWithPassword(id: number): Promise<Business> {
    const business = await this.createQueryBuilder('business')
      .addSelect('business.password')
      .where('business.id = :id', { id })
      .andWhere('business.status <> :status', { status: StatusEnum.DELETED })
      .getOneOrFail()
      .catch((error) => {
        LogError(
          this.logger,
          error as Error,
          this.findOneByIdWithPassword.name,
        );
        throw new NotAcceptableException(this._uList.businessNotFound);
      });
    return business;
  }

  /**
   * Validates that the email is unique, excluding the business with the given id.
   * @param {string} email - Email to validate
   * @param {number} excludeId - Business ID to exclude from the check (current business)
   */
  async validateBusinessEmailUnique(
    email: string,
    excludeId: number,
  ): Promise<void> {
    const business = await this.createQueryBuilder('b')
      .where('LOWER(b.email) = LOWER(:email)', { email })
      .andWhere('b.status <> :status', { status: StatusEnum.DELETED })
      .andWhere('b.id <> :excludeId', { excludeId })
      .getOne();
    if (business) {
      LogError(
        this.logger,
        this._uList.mailExists.message,
        this.validateBusinessEmailUnique.name,
      );
      throw new NotAcceptableException(this._uList.mailExists);
    }
  }

  /**
   * Check if a business exists with the given email
   * @param {string} email - email to check
   * @returns {Promise<boolean>}
   */
  async checkBusinessExistByEmail(email: string): Promise<boolean> {
    const business = await this.findOneWithOptions({
      where: {
        email: email.toLowerCase(),
        status: Not(StatusEnum.DELETED),
      },
    });
    return !!business;
  }

  /**
   * Find Business by email with password (for auth)
   * @param {string} email - email
   * @returns {Promise<Business>}
   */
  async findOneByEmailWithPassword(email: string): Promise<Business> {
    try {
      return await this.createQueryBuilder('business')
        .addSelect('business.password')
        .leftJoinAndSelect('business.businessRoles', 'businessRoles')
        .leftJoinAndSelect('businessRoles.role', 'role')
        .leftJoinAndSelect('role.rolePermissions', 'rolePermissions')
        .leftJoinAndSelect('rolePermissions.permission', 'permission')
        .where('LOWER(business.email) = LOWER(:email)', { email })
        .andWhere('business.status <> :status', { status: StatusEnum.DELETED })
        .getOneOrFail();
    } catch (error) {
      LogError(
        this.logger,
        error as Error,
        this.findOneByEmailWithPassword.name,
      );
      throw new NotAcceptableException(this._uList.businessNotFound);
    }
  }

  /**
   * Find User by ID, email and status
   * @param {number} id - user ID
   * @param {string} email - user email
   * @param {StatusEnum} status - user status
   * @returns {Promise<Business>}
   */
  async findOneByIdBusinessAndToken(
    id: number,
    email: string,
    status: StatusEnum,
  ): Promise<Business> {
    return await this.findOneWithOptionsOrFail({
      where: { id, email, status },
    }).catch((error) => {
      LogError(
        this.logger,
        error as Error,
        this.findOneByIdBusinessAndToken.name,
      );
      throw new UnauthorizedException(this._uToken.tokenNotValid);
    });
  }

  /**
   * Counts businesses that are not soft-deleted (admin statistics).
   * @returns {Promise<number>} Business count.
   */
  async getNonDeletedBusinessesCountForAdminStatistics(): Promise<number> {
    return this.businessRepository.count({
      where: { status: Not(StatusEnum.DELETED) },
    });
  }

  /**
   * Counts non-deleted businesses marked online (admin statistics).
   * @returns {Promise<number>} Online business count.
   */
  async getOnlineNonDeletedBusinessesCountForAdminStatistics(): Promise<number> {
    return this.businessRepository.count({
      where: {
        status: Not(StatusEnum.DELETED),
        isOnline: true,
      },
    });
  }

  /**
   * Groups non-deleted businesses by status (admin statistics).
   * @returns {Promise<IAdminStatusCount[]>} Status counts.
   */
  async getBusinessesGroupedByStatusForAdminStatistics(): Promise<
    IAdminStatusCount[]
  > {
    const rows = await this.createQueryBuilder('b')
      .select('b.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('b.status <> :deleted', { deleted: StatusEnum.DELETED })
      .groupBy('b.status')
      .getRawMany<{ status: string; count: string }>();
    return rows.map((r) => ({
      status: r.status,
      count: parseInt(r.count ?? '0', 10),
    }));
  }

  /**
   * Count new business registrations (non-deleted) for admin statistics.
   * With `startDate` and `endDate`, counts rows whose `creation_date` lies in that inclusive range; otherwise counts all such businesses.
   * @param {ITimePeriodFilter} timePeriod - Optional date bounds.
   * @returns {Promise<IAdminTimeSeriesStats>} Total only (`data` is never set).
   */
  async getNewBusinessesStatsForAdminStatistics(
    timePeriod: ITimePeriodFilter,
  ): Promise<IAdminTimeSeriesStats> {
    const qb = this.createQueryBuilder('b').where(
      'b.status <> :businessStatus',
      {
        businessStatus: StatusEnum.DELETED,
      },
    );
    if (timePeriod?.startDate && timePeriod?.endDate) {
      qb.andWhere(
        'b.creationDate >= :startDate AND b.creationDate <= :endDate',
        {
          startDate: timePeriod.startDate,
          endDate: timePeriod.endDate,
        },
      );
    }
    const total = await qb.getCount();
    return { total };
  }

  /**
   * Format Business data
   * @param {Business} business - Business entity
   * @returns {Business} - Formatted Business entity
   */
  private formatBusiness(business: Business): Business {
    if (business.locations && business.locations.length > 0) {
      business.locations = business.locations.filter(
        (location) => location.status !== StatusEnum.DELETED,
      );
    }
    if (business.password) delete business?.password;
    return business;
  }

  /**
   * Format Businesses data
   * @param {Business[]} businesses - Array of Business entities
   * @returns {Business[]} - Array of Formatted Business entities
   */
  private formatBusinesses(businesses: Business[]): Business[] {
    return businesses.map((business) => this.formatBusiness(business));
  }

  /**
   * Applies public business relations used in listing and detail queries.
   * Includes image, non-deleted locations, and business followers.
   * @param {SelectQueryBuilder<Business>} queryBuilder - Base business query.
   * @returns {SelectQueryBuilder<Business>} Query with common relations.
   */
  private applyBusinessPublicRelations(
    queryBuilder: SelectQueryBuilder<Business>,
  ): SelectQueryBuilder<Business> {
    return queryBuilder
      .leftJoinAndSelect('b.image', 'image')
      .leftJoinAndSelect(
        'b.locations',
        'locations',
        'locations.status <> :locationStatus',
        { locationStatus: StatusEnum.DELETED },
      )
      .leftJoinAndSelect('b.businessFollowers', 'businessFollowers')
      .leftJoinAndSelect('b.businessHours', 'businessHours')
      .leftJoinAndSelect(
        'b.discounts',
        'discounts',
        'discounts.status = :discountStatus',
        { discountStatus: StatusEnum.ACTIVE },
      );
  }
}
