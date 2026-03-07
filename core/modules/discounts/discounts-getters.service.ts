import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { LogError } from '../../common/helpers/logger.helper';
import { discountsResponses } from '../../common/responses';
import { DiscountScopeEnum, StatusEnum } from '../../common/enums';
import { InfinityScrollInput } from '../../common/dtos';
import { IPaginatedResult } from '../../common/interfaces';
import { Discount, DiscountProductAudit } from '../../entities';
import { DiscountProductsGettersService } from '../discount-products/discount-products-getters.service';
import { DiscountProductAuditsGettersService } from '../discount-product-audits/discount-product-audits-getters.service';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { ProductsGettersService } from '../products/products-getters.service';

/**
 * Read-only service for querying discounts.
 */
@Injectable()
export class DiscountsGettersService extends BasicService<Discount> {
    private readonly logger = new Logger(DiscountsGettersService.name);
    private readonly rList = discountsResponses.list;
    private readonly relations = ['currency', 'business', 'catalog'];

    constructor(
        @InjectRepository(Discount)
        private readonly discountRepository: Repository<Discount>,
        private readonly discountProductsGettersService: DiscountProductsGettersService,
        private readonly discountProductAuditsGettersService: DiscountProductAuditsGettersService,
        private readonly catalogsGettersService: CatalogsGettersService,
        private readonly productsGettersService: ProductsGettersService,
    ) {
        super(discountRepository);
    }

    /**
     * Find a discount by ID with relations.
     * @param {number} id - The discount ID.
     * @returns {Promise<Discount>} The found discount.
     */
    async findOne(id: number): Promise<Discount> {
        try {
            return await this.findOneWithOptionsOrFail({
                where: { id, status: Not(StatusEnum.DELETED) },
                relations: this.relations,
            });
        } catch (error) {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find a discount by ID and scope (type).
     * @param {number} id - The discount ID.
     * @param {DiscountScopeEnum} scope - The discount scope.
     * @returns {Promise<Discount>} The found discount.
     */
    async findOneByIdAndScope(id: number, scope: DiscountScopeEnum): Promise<Discount> {
        try {
            const discount = await this.findOneWithOptionsOrFail({
                where: { id, scope, status: Not(StatusEnum.DELETED) },
                relations: this.relations,
            });
            return discount;
        } catch (error) {
            LogError(this.logger, error, this.findOneByIdAndScope.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }

    /**
     * Find a discount by ID and verify business ownership based on scope.
     * @param {number} id - The discount ID.
     * @param {number} businessId - The business ID.
     * @returns {Promise<Discount>} The found discount.
     */
    async findOneAndVerifyOwnership(id: number, businessId: number): Promise<Discount> {
        const discount = await this.findOne(id);
        await this.verifyBusinessOwnership(discount, businessId);
        return discount;
    }

    /**
     * Verify that the business owns the discount based on its scope.
     * @param {Discount} discount - The discount to verify.
     * @param {number} businessId - The business ID.
     */
    async verifyBusinessOwnership(discount: Discount, businessId: number): Promise<void> {
        switch (discount.scope) {
            case DiscountScopeEnum.BUSINESS:
                if (discount.idCreationBusiness !== businessId) {
                    LogError(this.logger, this.rList.notFound.message, this.verifyBusinessOwnership.name);
                    throw new ForbiddenException(this.rList.notFound);
                }
                break;
            case DiscountScopeEnum.CATALOG:
                if (!discount.idCatalog) {
                    LogError(this.logger, this.rList.notFound.message, this.verifyBusinessOwnership.name);
                    throw new NotFoundException(this.rList.notFound);
                }
                await this.catalogsGettersService.checkIfExistsByIdAndBusinessId(
                    discount.idCatalog,
                    businessId,
                );
                break;
            case DiscountScopeEnum.PRODUCT: {
                const discountProducts = await this.discountProductsGettersService
                    .findAllByDiscountId(discount.id);
                const firstProduct = discountProducts[0];
                if (!firstProduct) {
                    LogError(this.logger, this.rList.notFound.message, this.verifyBusinessOwnership.name);
                    throw new NotFoundException(this.rList.notFound);
                }
                await this.productsGettersService
                    .findOneByBusinessId(firstProduct.idProduct, businessId);
                break;
            }
            default:
                LogError(this.logger, this.rList.notFound.message, this.verifyBusinessOwnership.name);
                throw new ForbiddenException(this.rList.notFound);
        }
    }

    /**
     * Find all discounts belonging to a business, regardless of scope (business, catalog, product).
     * @param {number} idBusiness - The business ID.
     * @returns {Promise<Discount[]>} Array of discounts.
     */
    async findAllByBusiness(idBusiness: number): Promise<Discount[]> {
        return await this.find({
            where: { idCreationBusiness: idBusiness, status: Not(StatusEnum.DELETED) },
            relations: this.relations,
            order: { creationDate: 'DESC' },
        });
    }

    /**
     * Find all discounts with scope = catalog for a given catalog.
     * @param {number} idCatalog - The catalog ID.
     * @returns {Promise<Discount[]>} Array of catalog-scope discounts.
     */
    async findAllByCatalog(idCatalog: number): Promise<Discount[]> {
        return await this.find({
            where: {
                idCatalog,
                scope: DiscountScopeEnum.CATALOG,
                status: Not(StatusEnum.DELETED),
            },
            relations: this.relations,
            order: { creationDate: 'DESC' },
        });
    }

    /**
     * Find all discounts with scope = catalog belonging to a business.
     * @param {number} idBusiness - The business ID.
     * @returns {Promise<Discount[]>} Array of catalog-scope discounts.
     */
    async findAllByScopeCatalog(idBusiness: number): Promise<Discount[]> {
        return await this.find({
            where: {
                idCreationBusiness: idBusiness,
                scope: DiscountScopeEnum.CATALOG,
                status: Not(StatusEnum.DELETED),
            },
            relations: this.relations,
            order: { creationDate: 'DESC' },
        });
    }

    /**
     * Find all discounts with scope = product belonging to a business.
     * @param {number} idBusiness - The business ID.
     * @returns {Promise<Discount[]>} Array of product-scope discounts.
     */
    async findAllByScopeProduct(idBusiness: number): Promise<Discount[]> {
        return await this.find({
            where: {
                idCreationBusiness: idBusiness,
                scope: DiscountScopeEnum.PRODUCT,
                status: Not(StatusEnum.DELETED),
            },
            relations: this.relations,
            order: { creationDate: 'DESC' },
        });
    }

    /**
     * Find discounts by scope with pagination.
     * @param {DiscountScopeEnum} scope - The scope filter.
     * @param {number} idBusiness - The business ID.
     * @param {InfinityScrollInput} pagination - Pagination parameters.
     * @returns {Promise<IPaginatedResult<Discount>>} Paginated result.
     */
    async findAllByScopePaginated(
        scope: DiscountScopeEnum,
        idBusiness: number,
        pagination: InfinityScrollInput,
    ): Promise<IPaginatedResult<Discount>> {
        const page = pagination.page || 1;
        const limit = pagination.limit || 10;
        const skip = (page - 1) * limit;
        const order = pagination.order || 'DESC';
        const orderBy = pagination.orderBy || 'creation_date';
        const qb = this.createQueryBuilder('d')
            .leftJoinAndSelect('d.currency', 'currency')
            .leftJoinAndSelect('d.business', 'business')
            .leftJoinAndSelect('d.catalog', 'catalog')
            .where('d.idCreationBusiness = :idBusiness', { idBusiness })
            .andWhere('d.status <> :status', { status: StatusEnum.DELETED })
            .limit(limit)
            .offset(skip)
            .orderBy(`d.${orderBy}`, order);
        if (scope !== DiscountScopeEnum.BUSINESS) qb.andWhere('d.scope = :scope', { scope });
        const items = await qb.getMany();
        const total = items.length;
        return { items, total, page, limit };
    }

    /**
     * Find the active discount for a product (from discount_product table).
     * @param {number} idProduct - The product ID.
     * @returns {Promise<Discount | null>} The discount or null if none.
     */
    async findActiveDiscountByProduct(idProduct: number): Promise<Discount | null> {
        const discountProduct = await this.discountProductsGettersService
            .findByProductIdWithDiscount(idProduct);
        if (!discountProduct?.discount) return null;
        const discount = discountProduct.discount;
        if (discount.status !== StatusEnum.ACTIVE) return null;
        const now = new Date();
        if (discount.startDate <= now && discount.endDate >= now) return discount;
        return null;
    }

    /**
     * Find audit history for a product.
     * @param {number} idProduct - The product ID.
     * @param {number} [limit=50] - Max records.
     * @returns {Promise<DiscountProductAudit[]>} Array of audit records.
     */
    async findAuditByProduct(idProduct: number, limit: number = 50): Promise<DiscountProductAudit[]> {
        return await this.discountProductAuditsGettersService.findByProductId(idProduct, limit);
    }

    /**
     * Find audit history for a discount.
     * @param {number} idDiscount - The discount ID.
     * @param {number} [limit=50] - Max records.
     * @returns {Promise<DiscountProductAudit[]>} Array of audit records.
     */
    async findAuditByDiscount(idDiscount: number, limit: number = 50): Promise<DiscountProductAudit[]> {
        return await this.discountProductAuditsGettersService.findByDiscountId(idDiscount, limit);
    }
}
