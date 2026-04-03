import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
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
import {
  ActionsEnum,
  AuditOperationEnum,
  AuditableEntityNameEnum,
  CatalogsConsumerEnum,
  QueueNamesEnum,
} from '../../common/enums';
import { EntityAuditsQueueService } from '../entity-audits/entity-audits-queue.service';
import { toEntityAuditValues } from '../entity-audits/entity-audit-values.helper';

@Injectable()
export class CatalogsSettersService extends BasicService<Catalog> {
  private logger = new Logger(CatalogsSettersService.name);
  private readonly rCreate = catalogsResponses.create;
  private readonly rUpdate = catalogsResponses.update;
  private readonly rDelete = catalogsResponses.delete;

  constructor(
    @InjectRepository(Catalog)
    private readonly catalogRepository: Repository<Catalog>,
    private readonly entityAuditsQueueService: EntityAuditsQueueService,
    @InjectQueue(QueueNamesEnum.catalogs)
    private readonly catalogsQueue: Queue,
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
    businessReq: IBusinessReq,
  ): Promise<Catalog> {
    try {
      const catalog = await this.save(data, businessReq);
      await this.entityAuditsQueueService.addRecordJob({
        entityName: AuditableEntityNameEnum.Catalog,
        entityId: catalog.id,
        operation: AuditOperationEnum.INSERT,
        newValues: toEntityAuditValues(catalog),
        userOrBusinessReq: businessReq,
      });
      return catalog;
    } catch (error) {
      LogError(this.logger, error as Error, this.create.name, businessReq);
      throw new InternalServerErrorException(this.rCreate.error);
    }
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
    businessReq: IBusinessReq,
  ) {
    try {
      const oldValues = toEntityAuditValues(catalog);
      const updated = await this.updateEntity(data, catalog, businessReq);
      await this.entityAuditsQueueService.addRecordJob({
        entityName: AuditableEntityNameEnum.Catalog,
        entityId: catalog.id,
        operation: AuditOperationEnum.UPDATE,
        oldValues,
        newValues: toEntityAuditValues(updated),
        userOrBusinessReq: businessReq,
      });
      return updated;
    } catch (error) {
      LogError(this.logger, error as Error, this.update.name, businessReq);
      throw new InternalServerErrorException(this.rUpdate.error);
    }
  }

  /**
   * Remove a catalog.
   * @param {Catalog} catalog - The catalog to remove.
   * @param {IBusinessReq} businessReq - The business request object.
   * @returns {Promise<Catalog | Catalog[]>} The removed catalog.
   */
  @Transactional()
  async remove(
    catalog: Catalog,
    businessReq: IBusinessReq,
  ): Promise<Catalog | Catalog[]> {
    try {
      await this.entityAuditsQueueService.addRecordJob({
        entityName: AuditableEntityNameEnum.Catalog,
        entityId: catalog.id,
        operation: AuditOperationEnum.DELETE,
        oldValues: toEntityAuditValues(catalog),
        userOrBusinessReq: businessReq,
      });
      return await this.deleteEntityByStatus(catalog, businessReq);
    } catch (error) {
      LogError(this.logger, error as Error, this.remove.name, businessReq);
      throw new InternalServerErrorException(this.rDelete.error);
    }
  }

  /**
   * Increments or decrements the products count on a catalog.
   * @param {Catalog} catalog - The catalog.
   * @param {ActionsEnum} action - Whether to add or subtract one.
   * @param {IBusinessReq} businessReq - The business request object.
   */
  async updateProductsCount(
    catalog: Catalog,
    action: ActionsEnum,
    businessReq: IBusinessReq,
  ): Promise<void> {
    let productsCount = Number(catalog.productsCount);
    switch (action) {
      case ActionsEnum.Increment:
        productsCount++;
        break;
      case ActionsEnum.Decrement:
        productsCount--;
        break;
    }
    await this.updateEntity({ productsCount }, catalog, businessReq);
  }

  /**
   * Increment the visits count on a catalog.
   * @param {Catalog} catalog - The catalog.
   */
  async incrementVisits(catalog: Catalog) {
    const visits = Number(catalog.visits) + 1;
    const businessReq: IBusinessReq = {
      businessId: catalog.idCreationBusiness,
      path: catalog.business.path,
    };
    await this.updateEntity({ visits }, catalog, businessReq);
  }

  /**
   * Queues the background job for the catalog products count.
   * @param {number} idCatalog - The ID of the catalog.
   * @param {ActionsEnum} action - The action to perform.
   * @param {IBusinessReq} businessReq - The business request object.
   */
  async updateProductsCountJob(
    idCatalog: number,
    action: ActionsEnum,
    businessReq: IBusinessReq,
  ) {
    await this.catalogsQueue.add(
      CatalogsConsumerEnum.UpdateProductsCount,
      { idCatalog, action, businessReq },
      { delay: 1000 * 60 },
    );
  }

  /**
   * Generate a URL-friendly path from a catalog title.
   * - lowercases
   * - removes diacritics (accents)
   * - replaces any non-alphanumeric sequence with a single hyphen
   * - trims leading/trailing hyphens
   * @param {string} title - The catalog title
   * @returns {string} The generated path
   */
  generatePathFromTitle(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-+/g, '-');
  }
}
