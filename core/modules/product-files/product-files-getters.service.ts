import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { InfinityScrollInput } from '../../common/dtos';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { productFilesResponses } from '../../common/responses';
import { ProductFile } from '../../entities';

@Injectable()
export class ProductFilesGettersService extends BasicService<ProductFile> {
    private logger = new Logger(ProductFilesGettersService.name);
    private readonly rList = productFilesResponses.list;

    constructor(
      @InjectRepository(ProductFile)
      private readonly productFileRepository: Repository<ProductFile>,
    ) {
      super(productFileRepository);
    }

    /**
     * Get all ProductFiles with pagination
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<ProductFile[]>}
     */
    async findAll(query: InfinityScrollInput): Promise<ProductFile[]> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const order = query.order || 'DESC';
        const orderBy = query.orderBy || 'creation_date';
        return await this.createQueryBuilder('pf')
            .leftJoinAndSelect('pf.file', 'file')
            .leftJoinAndSelect('pf.product', 'product')
            .where('pf.status <> :status', { status: StatusEnum.DELETED })
            .limit(limit)
            .offset(skip)
            .orderBy(`pf.${orderBy}`, order)
            .getMany();
    }

    /**
     * Get all ProductFiles by product ID
     * @param {number} idProduct - The product ID
     * @returns {Promise<ProductFile[]>}
     */
    async findByProductId(idProduct: number): Promise<ProductFile[]> {
        return await this.createQueryBuilder('pf')
            .leftJoinAndSelect('pf.file', 'file')
            .where('pf.idProduct = :idProduct', { idProduct })
            .andWhere('pf.status <> :status', { status: StatusEnum.DELETED })
            .orderBy('pf.order', 'ASC')
            .getMany();
    }

    /**
     * Find a product file by its ID.
     * @param {number} id - The ID of the product file to find.
     * @returns {Promise<ProductFile>} The found product file.
     */
    async findOne(id: number): Promise<ProductFile> {
        try {
            return await this.findOneWithOptionsOrFail({ 
                where: { id, status: Not(StatusEnum.DELETED) },
                relations: ['file', 'product']
            });
        } catch (error) {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }
}
