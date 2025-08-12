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

@Injectable()
export class CatalogsService extends BasicService<Catalog> {
    private logger = new Logger(CatalogsService.name);

    constructor(
      @Inject(REQUEST)
      private readonly businessRequest: Request,
      @InjectRepository(Catalog)
      private readonly catalogRepository: Repository<Catalog>,
      private readonly catalogsSettersService: CatalogsSettersService,
      private readonly catalogsGettersService: CatalogsGettersService
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
      const catalog = await this.catalogsSettersService.create(data, businessReq);
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
     * Find a catalog by its ID.
     * @param {number} id - The ID of the catalog to find.
     * @returns {Promise<Catalog>} The found catalog.
     */
    async findOne(id: number): Promise<Catalog> {
      return await this.catalogsGettersService.findOne(id);
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
      await this.catalogsSettersService.update(catalog, data, businessReq);
      return await this.catalogsGettersService.findOne(catalog.id);
    }

    /**
     * Remove a catalog.
     * @param {number} id - The ID of the catalog to remove.
     * @param {IBusinessReq} businessReq - The business request object.
     * @return {Promise<boolean>} True if the catalog was removed successfully.
     */
    @Transactional()
    async remove(id: number, businessReq: IBusinessReq): Promise<boolean> {
      const catalog = await this.catalogsGettersService.findOne(id);
      await this.catalogsSettersService.remove(catalog, businessReq);
      return true;
    }
}
