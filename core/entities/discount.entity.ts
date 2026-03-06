import { Check, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { DiscountTypeEnum } from '../common/enums';
import { Business, Catalog, Currency, DiscountProduct } from './';

/**
 * Entity representing a discount definition.
 * Scope is inferred: id_business = business scope, id_catalog = catalog scope, both null = product scope.
 * The actual product assignments are stored in DiscountProduct.
 */
@Entity({ name: 'discounts' })
@Check(
    `(id_business IS NOT NULL AND id_catalog IS NULL) OR ` +
        `(id_business IS NULL AND id_catalog IS NOT NULL) OR ` +
        `(id_business IS NULL AND id_catalog IS NULL)`,
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

    @Column('int8', { name: 'id_business', nullable: true })
    idBusiness?: number;

    @ManyToOne(() => Business, (business) => business.discounts)
    @JoinColumn([{ name: 'id_business', referencedColumnName: 'id' }])
    business?: Business;

    @Column('int8', { name: 'id_catalog', nullable: true })
    idCatalog?: number;

    @ManyToOne(() => Catalog, (catalog) => catalog.discounts)
    @JoinColumn([{ name: 'id_catalog', referencedColumnName: 'id' }])
    catalog?: Catalog;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @ManyToOne(() => Business, (business) => business.creationDiscounts)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    creationBusiness?: Business;

    @ManyToOne(() => Business, (business) => business.modifiedDiscounts)
    @JoinColumn([{ name: 'modification_business', referencedColumnName: 'id' }])
    modificationBusiness?: Business;

    @OneToMany(() => DiscountProduct, (discountProduct) => discountProduct.discount)
    discountProducts?: DiscountProduct[];
}
