import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BusinessVisitsSettersService } from '../business-visits/business-visits-setters.service';
import { ProductVisitsSettersService } from '../product-visits/product-visits-setters.service';
import { CatalogVisitsSettersService } from '../catalog-visits/catalog-visits-setters.service';
import { IRecordVisitInput } from './interfaces/record-visit-input.interface';
import { IUserReq } from '../../common/interfaces';
import { QueueNamesEnum, SearchDataConsumerEnum, VisitTypeEnum } from '../../common/enums';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { LogError } from '../../common/helpers/logger.helper';
import { visitsResponses } from '../../common/responses';

/**
 * Service that handles recording visits to businesses, products, and catalogs.
 * Delegates to the specific visit setters and increments the parent entity's visit count.
 * Enqueues a job to update search index counters asynchronously.
 */
@Injectable()
export class VisitsService {
    private logger: Logger = new Logger(VisitsService.name);
    private readonly create = visitsResponses.create;

    constructor(
        private readonly businessVisitsSettersService: BusinessVisitsSettersService,
        private readonly productVisitsSettersService: ProductVisitsSettersService,
        private readonly catalogVisitsSettersService: CatalogVisitsSettersService,
        @InjectQueue(QueueNamesEnum.searchData)
        private readonly searchDataQueue: Queue,
    ) {}

    /**
     * Records a visit to a business, product, or catalog.
     * @param {IRecordVisitInput} input - The visit input (type, id).
     * @param {IUserReq | null} user - The logged-in user, or null for anonymous.
     */
    @Transactional()
    async recordVisit(
        input: IRecordVisitInput,
        user: IUserReq | null
    ) {
        switch (input.type) {
            case VisitTypeEnum.BUSINESS:
                await this.businessVisitsSettersService
                    .create({ idBusiness: input.id }, user);
                break;
            case VisitTypeEnum.PRODUCT:
                await this.productVisitsSettersService
                    .create({ idProduct: input.id }, user);
                break;
            case VisitTypeEnum.CATALOG:
                await this.catalogVisitsSettersService
                    .create({ idCatalog: input.id }, user);
                break;
            default:
                LogError(
                    this.logger,
                    `Invalid visit type: ${input.type}`,
                    this.recordVisit.name,
                    user
                );
                throw new BadRequestException(this.create.error);
        }
        await this.searchDataQueue.add(
            SearchDataConsumerEnum.SearchDataVisitRecord,
            { type: input.type, id: input.id }
        );
    }
}
