import { Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogError } from '../../common/helpers/logger.helper';
import { IBusinessReq, IUserReq } from '../../common/interfaces';
import { BasicService } from '../../common/services';
import { Business } from '../../entities';
import { businessesResponses } from '../../common/responses';
import { CreateBusinessInput } from './dto/create-business.input';
import { UpdateBusinessInput } from './dto/update-business.input';
import { Transactional } from 'typeorm-transactional-cls-hooked';


@Injectable()
export class BusinessesSettersService extends BasicService<Business> {
    private logger: Logger = new Logger(BusinessesSettersService.name);
    private readonly _uCreate = businessesResponses.create;
    private readonly _ucUpdate = businessesResponses.update;
    private readonly _ucDelete = businessesResponses.delete;

    constructor(
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
    ) {
        super(businessRepository);
    }
    /**
     * Create Business
     * @param {CreateBusinessInput} data - The data to create a new business
     * @returns {Promise<Business>}
     */
    @Transactional()
    async create(data: CreateBusinessInput): Promise<Business> {
        // Check duplicate email before attempting to save to provide a clearer error
        const exists = await this.businessRepository.findOne({ where: { email: data.email } });
        if (exists) {
            throw new BadRequestException(this._uCreate.mailExists);
        }

        return await this.save(data).catch((error) => {
            LogError(this.logger, error, this.create.name);
            // Handle DB unique constraint violation gracefully
            // Postgres uses error.code === '23505' for unique violations
            const pgCode = (error && error.code) ? error.code : null;
            const constraint = (error && error.constraint) ? error.constraint : null;
            if (pgCode === '23505') {
                if (constraint && constraint.includes('email')) {
                    throw new BadRequestException(this._uCreate.mailExists);
                }
                if (constraint && constraint.includes('path')) {
                    throw new BadRequestException(this._uCreate.pathExists);
                }
            }
            throw new InternalServerErrorException(this._uCreate.error);
        });
    }

    /**
     * Update Business
     * @param {UpdateBusinessInput} data - The data to update the Business
     * @param {Business} business - The Business to update
     * @param {IBusinessReq} businessReq - The logged business
     * @returns {Promise<Business>}
     */
    async update(
        data: UpdateBusinessInput,
        business: Business,
        businessReq: IBusinessReq
    ): Promise<Business> {
        return await this.updateEntity(data, business, businessReq).catch((error) => {
            LogError(this.logger, error, this.update.name, businessReq);
            throw new InternalServerErrorException(this._ucUpdate.error);
        });
    }

    /**
     * Remove User
     * @param {Business} business - The business to remove
     * @param {IBusinessReq} businessReq - The logged business
     */
    async remove(business: Business, businessReq: IBusinessReq) {
        await this.deleteEntityByStatus(business, businessReq).catch((error) => {
            LogError(this.logger, error, this.remove.name, businessReq);
            throw new InternalServerErrorException(this._ucDelete.error);
        });
    }

    /**
     * Increment the followers count on a business.
     * @param {Business} business - The business.
     * @param {IUserReq} userReq - The user request object.
     */
    async incrementFollowers(business: Business, userReq: IUserReq) {
        const followers = business.followers + 1;
        await this.updateEntity({ followers }, business, userReq);
    }

    /**
     * Decrement the followers count on a business.
     * @param {Business} business - The business.
     * @param {IUserReq} userReq - The user request object.
     */
    async decrementFollowers(business: Business, userReq: IUserReq) {
        const followers = business.followers - 1;
        await this.updateEntity({ followers }, business, userReq);
    }

    /**
     * Increment the visits count on a business.
     * @param {Business} business - The business.
     */
    async incrementVisits(business: Business) {
        const visits = Number(business.visits) + 1;
        const businessReq: IBusinessReq = { businessId: business.id, path: business.path };
        await this.updateEntity({ visits }, business, businessReq);
    }
}
