import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { businessFollowersResponses } from '../../common/responses';
import { BusinessFollower } from '../../entities';

@Injectable()
export class BusinessFollowersGettersService extends BasicService<BusinessFollower> {
    private logger = new Logger(BusinessFollowersGettersService.name);
    private readonly rList = businessFollowersResponses.list;
    private readonly _relations = ['business', 'creationUser'];

    constructor(
      @InjectRepository(BusinessFollower)
      private readonly businessFollowerRepository: Repository<BusinessFollower>,
    ) {
      super(businessFollowerRepository);
    }

    /**
     * Find a business follower by ID.
     * @param {number} id - The business follower ID.
     * @returns {Promise<BusinessFollower>} The found business follower or null.
     */
    async findOne(id: number): Promise<BusinessFollower> {
        try {
            return await this.findOneWithOptionsOrFail({
                where: { id, status: Not(StatusEnum.DELETED) },
                relations: this._relations
            });
        } catch (error) {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find a business follower by business ID and user ID.
     * @param {number} idBusiness - The business ID.
     * @param {number} idCreationUser - The user ID.
     * @returns {Promise<BusinessFollower | null>} The found business follower or null.
     */
    async findOneByBusinessAndUser(
        idBusiness: number,
        idCreationUser: number
    ): Promise<BusinessFollower | null> {
        try {
            return await this.findOneWithOptions({
                where: {
                    idBusiness,
                    idCreationUser,
                    status: Not(StatusEnum.DELETED)
                },
                relations: this._relations
            });
        } catch (error) {
            LogError(this.logger, error, this.findOneByBusinessAndUser.name);
            return null;
        }
    }

    /**
     * Get all business followers by business ID.
     * @param {number} idBusiness - The business ID.
     * @returns {Promise<BusinessFollower[]>} Array of business followers.
     */
    async findAllByBusiness(idBusiness: number): Promise<BusinessFollower[]> {
        try {
            return await this.find({
                where: { idBusiness, status: Not(StatusEnum.DELETED) },
                relations: this._relations
            });
        } catch (error) {
            LogError(this.logger, error, this.findAllByBusiness.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Count followers by business ID.
     * @param {number} idBusiness - The business ID.
     * @returns {Promise<number>} The count of followers.
     */
    async countByBusiness(idBusiness: number): Promise<number> {
        try {
            return await this.createQueryBuilder('bf')
                .where('bf.idBusiness = :idBusiness', { idBusiness })
                .andWhere('bf.status <> :status', { status: StatusEnum.DELETED })
                .getCount();
        } catch (error) {
            LogError(this.logger, error, this.countByBusiness.name);
            return 0;
        }
    }
}
