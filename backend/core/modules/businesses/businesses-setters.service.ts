import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LogError } from '../../common/helpers/logger.helper';
import { IBusinessReq, IUserReq } from '../../common/interfaces';
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
     * @returns {Promise<Business>}
     */
    async create(data: CreateBusinessInput): Promise<Business> {
        return await this.save(data).catch((error) => {
            LogError(this.logger, error, this.create.name);
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
}
