import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCatalogInput } from './dto/create-catalog.input';
import { BasicService } from '../../common/services';
import { Catalog } from '../../entities';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { IBusinessReq } from '../../common/interfaces';
import { UpdateCatalogInput } from './dto/update-catalog.input';
import { catalogsResponses } from '../../common/responses';
import { LogError } from '../../common/helpers/logger.helper';

@Injectable()
export class CatalogsSettersService extends BasicService<Catalog> {
    private logger = new Logger(CatalogsSettersService.name);
    private readonly rCreate = catalogsResponses.create;
    private readonly rUpdate = catalogsResponses.update;
    private readonly rDelete = catalogsResponses.delete;

    constructor(
      @InjectRepository(Catalog)
      private readonly catalogRepository: Repository<Catalog>,
    ) {
      super(catalogRepository);
    }

    /**
     * Create a new catalog.
     * @param {CreateCatalogInput} data - The data for the new catalog.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<Catalog>} The created catalog.
     */
    @Transactional()
    async create(
      data: CreateCatalogInput,
      businessReq: IBusinessReq
    ): Promise<Catalog> {
      return await this.save(data, businessReq)
        .catch((error) => {
          LogError(this.logger, error, this.create.name, businessReq);
          throw new InternalServerErrorException(this.rCreate.error);
        });
    }

    /**
     * Update a catalog.
     * @param {Catalog} catalog - The catalog to update.
     * @param {UpdateCatalogInput} data - The data for updating the catalog.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    @Transactional()
    async update(
        catalog: Catalog,
        data: UpdateCatalogInput,
        businessReq: IBusinessReq
    ) {
      return await this.updateEntity(data, catalog, businessReq)
        .catch((error) => {
          LogError(this.logger, error, this.update.name, businessReq);
          throw new InternalServerErrorException(this.rUpdate.error);
        });
    }

    /**
     * Remove a catalog.
     * @param {Catalog} catalog - The catalog to remove.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    @Transactional()
    async remove(catalog: Catalog, businessReq: IBusinessReq) {
      return await this.deleteEntityByStatus(catalog, businessReq).catch((error) => {
        LogError(this.logger, error, this.remove.name, businessReq);
        throw new InternalServerErrorException(this.rDelete.error);
      });
    }
}
