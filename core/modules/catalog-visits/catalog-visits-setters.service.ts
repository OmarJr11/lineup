import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { CatalogVisit } from '../../entities';
import { ICreateCatalogVisit } from './interfaces/create-catalog-visit.interface';
import { IUserReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { visitsResponses } from '../../common/responses';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { CatalogsSettersService } from '../catalogs/catalogs-setters.service';

/**
 * Service that handles creating catalog visit records.
 */
@Injectable()
export class CatalogVisitsSettersService extends BasicService<CatalogVisit> {
    private readonly logger = new Logger(CatalogVisitsSettersService.name);
    private readonly rCreate = visitsResponses.create;

    constructor(
        @InjectRepository(CatalogVisit)
        private readonly catalogVisitRepository: Repository<CatalogVisit>,
        private readonly catalogsGettersService: CatalogsGettersService,
        private readonly catalogsSettersService: CatalogsSettersService
    ) {
        super(catalogVisitRepository);
    }

    /**
     * Records a visit to a catalog.
     * @param {ICreateCatalogVisit} data - The visit data.
     * @param {IUserReq | null} user - The logged-in user, or null for anonymous.
     * @returns {Promise<{ success: boolean; visits: number }>} Success and new visit count.
     */
    @Transactional()
    async create(
        data: ICreateCatalogVisit,
        user: IUserReq | null
    ) {
        const catalog = await this.catalogsGettersService.findOne(data.idCatalog);
        try {
            const visitData = {
                idCatalog: data.idCatalog,
                idCreationUser: user?.userId ?? undefined
            }
            await this.save(visitData, user);
            await this.catalogsSettersService.incrementVisits(catalog);
        } catch (error) {
            LogError(this.logger, error, this.create.name, user);
            throw new InternalServerErrorException(this.rCreate.error);
        }
    }
}
