import { AfterLoad, Check, Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';
import { Business, Catalog, Currency, DiscountProduct, ProductFile, ProductRating, ProductReaction, ProductSearchIndex, ProductSku, ProductTag, Tag, ProductVariation, ProductVisit } from '.';

export const PRODUCT_FILE_ORDER_ASC = (a: ProductFile, b: ProductFile) => a.order - b.order;

@Entity({ name: 'products' })
@Check(`(price IS NULL AND id_currency IS NULL) OR (price IS NOT NULL AND id_currency IS NOT NULL)`)
export class Product extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    subtitle: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price?: number;

    @Column('int8', { name: 'id_currency', nullable: true })
    idCurrency?: number;

    @ManyToOne(() => Currency, (currency) => currency.products)
    @JoinColumn([{ name: 'id_currency', referencedColumnName: 'id' }])
    currency?: Currency;

    @Column('int8', { default: 0 })
    likes: number;

    @Column('int8', { default: 0 })
    visits: number;

    /** Average star rating computed from all active ProductRating records. */
    @Column({ type: 'decimal', precision: 3, scale: 2, name: 'rating_average', default: 0 })
    ratingAverage: number;

    @Column('int8', { name: 'id_catalog' })
    idCatalog: number;

    @ManyToOne(() => Catalog, (catalog) => catalog.products)
    @JoinColumn([{ name: 'id_catalog', referencedColumnName: 'id' }])
    catalog?: Catalog;

    @OneToMany(() => ProductTag, (productTag) => productTag.product)
    productTags?: ProductTag[];

    /** Tags derived from productTags. Used by schema and search index. */
    get tags(): Tag[] {
        return this.productTags?.map((pt) => pt.tag).filter((t): t is Tag => !!t) ?? [];
    }

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @ManyToOne(() => Business, (business) => business.products)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    business?: Business;

    @ManyToOne(() => Business, (business) => business.modifiedProducts)
    @JoinColumn([{ name: 'modification_business', referencedColumnName: 'id' }])
    modificationBusiness?: Business;

    @OneToMany(() => ProductFile, (productFile) => productFile.product)
    productFiles?: ProductFile[];

    /**
     * Sorts productFiles by order field in ascending order after entity is loaded.
     */
    @AfterLoad()
    sortProductFilesByOrder(): void {
        if (!this.productFiles?.length) return;
        else this.productFiles.sort(PRODUCT_FILE_ORDER_ASC);
    }

    @OneToMany(() => ProductVariation, (variation) => variation.product)
    variations?: ProductVariation[];

    @OneToMany(() => ProductSku, (sku) => sku.product)
    skus?: ProductSku[];

    @OneToMany(() => ProductReaction, (reaction) => reaction.product)
    reactions?: ProductReaction[];

    @OneToMany(() => ProductVisit, (visit) => visit.product)
    productVisits?: ProductVisit[];

    @OneToMany(() => ProductSearchIndex, (index) => index.product)
    productSearchIndexes?: ProductSearchIndex[];

    @OneToMany(() => ProductRating, (rating) => rating.product)
    ratings?: ProductRating[];

    @OneToOne(() => DiscountProduct, (discountProduct) => discountProduct.product)
    discountProduct?: DiscountProduct;
}
