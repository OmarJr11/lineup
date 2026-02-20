import { Inject, Injectable, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { CreateCatalogInput } from './dto/create-catalog.input';
import { UpdateCatalogInput } from './dto/update-catalog.input';
import { BasicService } from '../../common/services';
import { Catalog } from '../../entities';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { IBusinessReq } from '../../common/interfaces';
import { CatalogsSettersService } from './catalogs-setters.service';
import { CatalogsGettersService } from './catalogs-getters.service';
import { InfinityScrollInput } from '../../common/dtos';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { QueueNamesEnum, SearchDataConsumerEnum } from '../../common/enums';

@Injectable()
export class CatalogsService extends BasicService<Catalog> {
    private logger = new Logger(CatalogsService.name);

    constructor(
      @Inject(REQUEST)
      private readonly businessRequest: Request,
      @InjectRepository(Catalog)
      private readonly catalogRepository: Repository<Catalog>,
      private readonly catalogsSettersService: CatalogsSettersService,
      private readonly catalogsGettersService: CatalogsGettersService,
      @InjectQueue(QueueNamesEnum.searchData)
      private readonly searchDataQueue: Queue,
    ) {
      super(catalogRepository, businessRequest);
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
      const tittleFormatted = this.catalogsSettersService
        .generatePathFromTitle(data.title);
      const path = await this.catalogsGettersService
        .checkCatalogPathExists(tittleFormatted);
      data.path = path;
      const catalog = await this.catalogsSettersService.create(data, businessReq);
      await this.searchDataQueue.add(
        SearchDataConsumerEnum.SearchDataCatalog,
        { idCatalog: catalog.id }
      );
      return await this.catalogsGettersService.findOne(catalog.id);
    }

    /**
     * Get all Catalogs with pagination
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<Catalog[]>}
     */
    async findAll(query: InfinityScrollInput): Promise<Catalog[]> {
      return await this.catalogsGettersService.findAll(query);
    }

    /**
     * Get all Catalogs with pagination
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<Catalog[]>}
     */
    async findAllMyCatalogs(
      query: InfinityScrollInput,
      businessReq: IBusinessReq
    ): Promise<Catalog[]> {
      return await this.catalogsGettersService.findAllMyCatalogs(query, businessReq);
    }

    /**
     * Find a catalog by its ID.
     * @param {number} id - The ID of the catalog to find.
     * @returns {Promise<Catalog>} The found catalog.
     */
    async findOne(id: number): Promise<Catalog> {
      return await this.catalogsGettersService.findOne(id);
    }

    /**
     * Find a catalog by its path or fail.
     * @param {string} path - The path of the catalog to find.
     * @returns {Promise<Catalog>} The found catalog.
     */
    async findOneByPath(path: string): Promise<Catalog> {
      return await this.catalogsGettersService.getOneByPathOrFail(path);
    }

    /**
     * Update a catalog.
     * @param {UpdateCatalogInput} data - The data for updating the catalog.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<Catalog>} The updated catalog.
     */ 
    @Transactional()
    async update(
      data: UpdateCatalogInput,
      businessReq: IBusinessReq
    ): Promise<Catalog> {
      const catalog = await this.catalogsGettersService.findOne(data.idCatalog);
      if(data.title && data.title !== catalog.title) {
        const tittleFormatted = this.catalogsSettersService
          .generatePathFromTitle(data.title);
        const path = await this.catalogsGettersService
          .checkCatalogPathExists(tittleFormatted, catalog.id);
        data.path = path;
      }
      await this.catalogsSettersService.update(catalog, data, businessReq);
      await this.searchDataQueue.add(
        SearchDataConsumerEnum.SearchDataCatalog,
        { idCatalog: catalog.id }
      );
      return await this.catalogsGettersService.findOne(catalog.id);
    }

    /**
     * Remove a catalog.
     * @param {number} id - The ID of the catalog to remove.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<Catalog>} The removed catalog.
     */
    @Transactional()
    async remove(id: number, businessReq: IBusinessReq): Promise<Catalog> {
      const catalog = await this.catalogsGettersService.findOne(id);
      return await this.catalogsSettersService.remove(catalog, businessReq);
    }
}
