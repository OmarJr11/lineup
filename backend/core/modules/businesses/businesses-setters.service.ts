import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogError } from '../../common/helpers/logger.helper';
import { IUserReq } from '../../common/interfaces';
import { BasicService } from '../../common/services';
import { Business } from '../../entities';
import { businessesResponses } from '../../common/responses';
import { CreateBusinessInput } from './dto/create-business.input';
import { UpdateBusinessInput } from './dto/update-business.input';


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
     * @param {IUserReq} user - The user making the request
     * @returns {Promise<Business>}
     */
    async create(data: CreateBusinessInput, user: IUserReq): Promise<Business> {
        return await this.save(data, user).catch((error) => {
            LogError(this.logger, error, this.create.name, user);
            throw new InternalServerErrorException(this._uCreate.error);
        });
    }

    /**
     * Update Business
     * @param {UpdateBusinessInput} data - The data to update the Business
     * @param {Business} business - The Business to update
     * @param {IUserReq} user - The logged user
     * @returns {Promise<Business>}
     */
    async update(
        data: UpdateBusinessInput,
        business: Business,
        user: IUserReq
    ): Promise<Business> {
        return await this.updateEntity(data, business, user).catch((error) => {
            LogError(this.logger, error, this.update.name, user);
            throw new InternalServerErrorException(this._ucUpdate.error);
        });
    }

    /**
     * Remove User
     * @param {Business} business - The business to remove
     * @param {IUserReq} user - The logged user
     */
    async remove(business: Business, user: IUserReq) {
        await this.deleteEntityByStatus(business, user).catch((error) => {
            LogError(this.logger, error, this.remove.name, user);
            throw new InternalServerErrorException(this._ucDelete.error);
        });
    }
}
