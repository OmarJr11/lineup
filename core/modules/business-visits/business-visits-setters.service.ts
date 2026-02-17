import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { BusinessVisit } from '../../entities';
import { ICreateBusinessVisit } from './interfaces/create-business-visit.interface';
import { IUserReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { visitsResponses } from '../../common/responses';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { BusinessesSettersService } from '../businesses/businesses-setters.service';

/**
 * Service that handles creating business visit records.
 */
@Injectable()
export class BusinessVisitsSettersService extends BasicService<BusinessVisit> {
    private readonly logger = new Logger(BusinessVisitsSettersService.name);
    private readonly rCreate = visitsResponses.create;

    constructor(
        @InjectRepository(BusinessVisit)
        private readonly businessVisitRepository: Repository<BusinessVisit>,
        private readonly businessesGettersService: BusinessesGettersService,
        private readonly businessesSettersService: BusinessesSettersService
    ) {
        super(businessVisitRepository);
    }

    /**
     * Records a visit to a business.
     * @param {ICreateBusinessVisit} data - The visit data.
     * @param {IUserReq | null} user - The logged-in user, or null for anonymous.
     */
    @Transactional()
    async create(
        data: ICreateBusinessVisit,
        user: IUserReq | null
    ) {
        const business = await this.businessesGettersService.findOne(data.idBusiness);
        try {
            const visitData = { idBusiness: data.idBusiness, creationUser: user?.userId ?? undefined }
            await this.save(visitData, user);
            await this.businessesSettersService.incrementVisits(business);
        } catch (error) {
            LogError(this.logger, error, this.create.name, user);
            throw new InternalServerErrorException(this.rCreate.error);
        }
    }
}
