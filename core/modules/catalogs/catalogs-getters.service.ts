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
    private readonly _relations = [
        'image', 
        'business', 'business.image', 
        'products', 
        'products.productFiles', 'products.productFiles.file', 
        'products.variations', 
        'products.reactions'
    ];

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
            .leftJoinAndSelect('c.business', 'business')
            .leftJoinAndSelect('business.image', 'businessImage')
            .leftJoinAndSelect('c.products', 'products')
            .leftJoinAndSelect('products.productFiles', 'productFiles')
            .leftJoinAndSelect('productFiles.file', 'productFilesFile')
            .leftJoinAndSelect('products.variations', 'variations')
            .leftJoinAndSelect('products.reactions', 'reactions')
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
            .leftJoinAndSelect('c.business', 'business')
            .leftJoinAndSelect('business.image', 'businessImage')
            .leftJoinAndSelect('c.products', 'products')
            .leftJoinAndSelect('products.productFiles', 'productFiles')
            .leftJoinAndSelect('productFiles.file', 'productFilesFile')
            .leftJoinAndSelect('products.variations', 'variations')
            .leftJoinAndSelect('products.reactions', 'reactions')
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
        try {
            return await this.findOneWithOptionsOrFail({    
                where: { id, status: Not(StatusEnum.DELETED) },
                relations: this._relations
            });
        } catch (error) {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find a catalog by its path.
     * @param {string} path - The path of the catalog to find.
     * @returns {Promise<Catalog | null>} The found catalog or null if not found.
     */
    async getOneByPath(path: string): Promise<Catalog | null> {
        return await this.findOneWithOptions({ where: { path  } });
    }

    /**
     * Find a catalog by its path with relations or fail.
     * @param {string} path - The path of the catalog to find.
     * @returns {Promise<Catalog>} The found catalog.
     */
    async getOneByPathOrFail(path: string): Promise<Catalog> {
        try {
            return await this.findOneWithOptionsOrFail({
                where: { path, status: Not(StatusEnum.DELETED) },
                relations: this._relations
            });
        } catch (error) {
            LogError(this.logger, error, this.getOneByPathOrFail.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    
    /**
     * Check if a catalog path exists and generate a unique path if it does.
     * @param {string} path - The initial catalog path to check.
     * @param {number} [excludeId] - Optional catalog ID to exclude from the check (for updates).
     * @returns {Promise<string>} A unique catalog path.
     */
    async checkCatalogPathExists(path: string, excludeId?: number): Promise<string> {
        const basePath = path;
        const existingCatalog = await this.getOneByPath(path);
        
        // If path doesn't exist, return it
        if (!existingCatalog) return path;
        
        // If path exists but belongs to the same catalog (update case), return it
        if (excludeId && existingCatalog.id === excludeId) return path;
        
        // Path exists and belongs to another catalog, need to find unique one
        let index = 1;
        let finalPath: string;
        
        do {
            const indexStr = index < 10 ? index.toString().padStart(2, '0') : index.toString();
            finalPath = `${basePath}-${indexStr}`;
            const checkCatalog = await this.getOneByPath(finalPath);
            
            // If path doesn't exist, we found a unique one
            if (!checkCatalog) break;
            
            // If path exists but belongs to the same catalog (update case), we found a unique one
            if (excludeId && checkCatalog.id === excludeId) break;
            
            // Path exists and belongs to another catalog, try next index
            index++;
        } while (true);
        
        return finalPath!;
    }
}
