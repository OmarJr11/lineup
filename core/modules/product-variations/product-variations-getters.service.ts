import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { InfinityScrollInput } from '../../common/dtos';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { productVariationsResponses } from '../../common/responses';
import { ProductVariation } from '../../entities';

@Injectable()
export class ProductVariationsGettersService extends BasicService<ProductVariation> {
    private logger = new Logger(ProductVariationsGettersService.name);
    private readonly rList = productVariationsResponses.list;
    private readonly relations = [
        'product',
        'business', 'business.image',
    ];

    constructor(
      @InjectRepository(ProductVariation)
      private readonly productVariationRepository: Repository<ProductVariation>,
    ) {
      super(productVariationRepository);
    }

    /**
     * Get all Product Variations with pagination
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<ProductVariation[]>}
     */
    async findAll(query: InfinityScrollInput): Promise<ProductVariation[]> {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const order = query.order || 'DESC';
        const orderBy = query.orderBy || 'creation_date';
        return await this.createQueryBuilder('pv')
            .leftJoinAndSelect('pv.product', 'product')
            .leftJoinAndSelect('pv.business', 'business')
            .leftJoinAndSelect('business.image', 'imageBusiness')
            .leftJoinAndSelect('pv.modificationBusiness', 'modificationBusiness')
            .leftJoinAndSelect('modificationBusiness.image', 'imageModificationBusiness')
            .where('pv.status <> :status', { status: StatusEnum.DELETED })
            .limit(limit)
            .offset(skip)
            .orderBy(`pv.${orderBy}`, order)
            .getMany();
    }

    /**
     * Find a product variation by its ID.
     * @param {number} id - The ID of the product variation to find.
     * @returns {Promise<ProductVariation>} The found product variation.
     */
    async findOne(id: number): Promise<ProductVariation> {
        return await this.findOneWithOptionsOrFail({ 
            where: { id, status: Not(StatusEnum.DELETED) },
        }).catch((error) => {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        });
    }

    /**
     * Find a product variation by its ID with relations.
     * @param {number} id - The ID of the product variation to find.
     * @returns {Promise<ProductVariation>} The found product variation.
     */
    async findOneWithRelations(id: number): Promise<ProductVariation> {
        try {
            return await this.findOneWithOptionsOrFail({ 
                where: { id, status: Not(StatusEnum.DELETED) },
                relations: this.relations,
            });
        } catch (error) {
            LogError(this.logger, error, this.findOneWithRelations.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Get all Product Variations by Product
     * @param {number} idProduct - The ID of the product
     * @returns {Promise<ProductVariation[]>}
     */
    async findAllByProduct(idProduct: number): Promise<ProductVariation[]> {
        return await this.createQueryBuilder('pv')
            .leftJoinAndSelect('pv.product', 'product')
            .leftJoinAndSelect('pv.business', 'business')
            .leftJoinAndSelect('business.image', 'imageBusiness')
            .leftJoinAndSelect('pv.modificationBusiness', 'modificationBusiness')
            .leftJoinAndSelect('modificationBusiness.image', 'imageModificationBusiness')
            .where('pv.status <> :status', { status: StatusEnum.DELETED })
            .andWhere('pv.idProduct = :idProduct', { idProduct })
            .getMany();
    }
}
