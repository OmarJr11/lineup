import { Check, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DiscountScopeEnum, DiscountTypeEnum, StatusEnum } from '../common/enums';
import { Business, Catalog, Currency, DiscountProduct } from './';

/**
 * Entity representing a discount definition.
 * Scope: business = idCreationBusiness is the business it applies to; catalog = id_catalog; product = single product via DiscountProduct.
 */
@Entity({ name: 'discounts' })
@Check(
    `(scope = 'business' AND id_catalog IS NULL) OR ` +
        `(scope = 'catalog' AND id_catalog IS NOT NULL) OR ` +
        `(scope = 'product' AND id_catalog IS NULL)`,
)
@Check(
    `(discount_type = 'percentage' AND id_currency IS NULL) OR (discount_type = 'fixed' AND id_currency IS NOT NULL)`,
)
export class Discount extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column({ type: 'enum', enum: DiscountTypeEnum, name: 'discount_type' })
    discountType: DiscountTypeEnum;

    /** Percentage (0-100) or fixed amount in currency units. */
    @Column({ type: 'decimal', precision: 10, scale: 2 })
    value: number;

    @Column('int8', { name: 'id_currency', nullable: true })
    idCurrency?: number;

    @ManyToOne(() => Currency, { nullable: true })
    @JoinColumn([{ name: 'id_currency', referencedColumnName: 'id' }])
    currency?: Currency;

    @Column({ type: 'timestamp with time zone', name: 'start_date' })
    startDate: Date;

    @Column({ type: 'timestamp with time zone', name: 'end_date' })
    endDate: Date;

    @Column({ type: 'enum', enum: DiscountScopeEnum })
    scope: DiscountScopeEnum;

    @Column('int8', { name: 'id_catalog', nullable: true })
    idCatalog?: number;

    @ManyToOne(() => Catalog, (catalog) => catalog.discounts)
    @JoinColumn([{ name: 'id_catalog', referencedColumnName: 'id' }])
    catalog?: Catalog;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.PENDING })
    status: StatusEnum;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @ManyToOne(() => Business, (business) => business.discounts)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    business?: Business;

    @ManyToOne(() => Business, (business) => business.modifiedDiscounts)
    @JoinColumn([{ name: 'modification_business', referencedColumnName: 'id' }])
    modificationBusiness?: Business;

    @OneToMany(() => DiscountProduct, (discountProduct) => discountProduct.discount)
    discountProducts?: DiscountProduct[];
}
