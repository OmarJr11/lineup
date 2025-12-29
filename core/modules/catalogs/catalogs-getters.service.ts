import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { StatusEnum } from '../../common/enums';
import { InfinityScrollInput } from '../../common/dtos';
import { catalogsResponses } from '../../common/responses';
import { LogError } from '../../common/helpers/logger.helper';
import { Catalog } from '../../entities';
import { IBusinessReq } from '../../common/interfaces';

@Injectable()
export class CatalogsGettersService extends BasicService<Catalog> {
    private logger = new Logger(CatalogsGettersService.name);
    private readonly rList = catalogsResponses.list;

    constructor(
      @InjectRepository(Catalog)
      private readonly catalogRepository: Repository<Catalog>,
    ) {
      super(catalogRepository);
    }

    /**
     * Get all Catalogs with pagination
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<Catalog[]>}
     */
    async findAll(query: InfinityScrollInput): Promise<Catalog[]> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const order = query.order || 'DESC';
        const orderBy = query.orderBy || 'creation_date';
        return await this.createQueryBuilder('c')
            .leftJoinAndSelect('c.image', 'image')
            .where('c.status <> :status', { status: StatusEnum.DELETED })
            .limit(limit)
            .offset(skip)
            .orderBy(`c.${orderBy}`, order)
            .getMany();
    }

    /**
     * Get all My Catalogs with pagination
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<Catalog[]>}
     */
    async findAllMyCatalogs(
        query: InfinityScrollInput,
        business: IBusinessReq
    ): Promise<Catalog[]> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const order = query.order || 'DESC';
        const orderBy = query.orderBy || 'creation_date';
        return await this.createQueryBuilder('c')
            .leftJoinAndSelect('c.image', 'image')
            .where('c.status <> :status', { status: StatusEnum.DELETED })
            .andWhere('c.idCreationBusiness = :idCreationBusiness', { idCreationBusiness: business.businessId })
            .limit(limit)
            .offset(skip)
            .orderBy(`c.${orderBy}`, order)
            .getMany();
    }

    /**
     * Find a catalog by its ID.
     * @param {number} id - The ID of the catalog to find.
     * @returns {Promise<Catalog>} The found catalog.
     */
    async findOne(id: number): Promise<Catalog> {
        return await this.findOneWithOptionsOrFail({ 
            where: { id, status: Not(StatusEnum.DELETED) },
            relations: ['image']
        }).catch((error) => {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        });
    }
}
