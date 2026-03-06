import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business, Discount, Product } from './';

/**
 * Junction entity that assigns a discount to a product.
 * One product can have at most one discount (enforced by id_product as PK).
 * When a more specific discount is created, this record is updated.
 */
@Entity({ name: 'discount_products' })
export class DiscountProduct extends BaseEntity {
    @PrimaryColumn('int8', { name: 'id_product' })
    idProduct: number;

    @ManyToOne(() => Product, (product) => product.discountProduct)
    @JoinColumn([{ name: 'id_product', referencedColumnName: 'id' }])
    product?: Product;

    @Column('int8', { name: 'id_discount' })
    idDiscount: number;

    @ManyToOne(() => Discount, (discount) => discount.discountProducts)
    @JoinColumn([{ name: 'id_discount', referencedColumnName: 'id' }])
    discount?: Discount;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @ManyToOne(() => Business, (business) => business.creationDiscountProducts)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    creationBusiness?: Business;
}
