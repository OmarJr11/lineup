import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { InfinityScrollInput } from '../../common/dtos';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { productsResponses } from '../../common/responses';
import { Product } from '../../entities';

@Injectable()
export class ProductsGettersService extends BasicService<Product> {
    private logger = new Logger(ProductsGettersService.name);
    private readonly rList = productsResponses.list;

    constructor(
      @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
    ) {
      super(productRepository);
    }

    /**
     * Get all Products with pagination
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<Product[]>}
     */
    async findAll(query: InfinityScrollInput): Promise<Product[]> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const order = query.order || 'DESC';
        const orderBy = query.orderBy || 'creation_date';
        return await this.createQueryBuilder('p')
            .where('p.status <> :status', { status: StatusEnum.DELETED })
            .limit(limit)
            .offset(skip)
            .orderBy(`p.${orderBy}`, order)
            .getMany();
    }

    /**
     * Find a product by its ID.
     * @param {number} id - The ID of the product to find.
     * @returns {Promise<Product>} The found product.
     */
    async findOne(id: number): Promise<Product> {
        return await this.findOneWithOptionsOrFail({ 
            where: { id, status: Not(StatusEnum.DELETED) } 
        }).catch((error) => {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        });
    }
}
