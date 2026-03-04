import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';
import { Business, Product, StockMovement } from './';

/**
 * Entity representing a Stock Keeping Unit (SKU) for a product.
 * Each SKU represents a unique combination of variation options (e.g. Color: "Amarillo", Talla: "M")
 * or a product without variations. The quantity field holds the stock for that combination.
 */
@Entity({ name: 'product_skus' })
export class ProductSku extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_product' })
    idProduct: number;

    @ManyToOne(() => Product, (product) => product.skus)
    @JoinColumn([{ name: 'id_product', referencedColumnName: 'id' }])
    product?: Product;

    /** Unique code for the SKU (e.g. "P1-AMAR-M"). */
    @Column({ type: 'varchar', name: 'sku_code', length: 100, unique: true })
    skuCode: string;

    /**
     * Selected options per variation type.
     * Example: { "Color": "Amarillo", "Talla": "M" }.
     * Empty object {} for products without variations.
     */
    @Column({ type: 'jsonb', name: 'variation_options', default: {} })
    variationOptions: Record<string, string>;

    /** Stock quantity for this SKU. */
    @Column({ type: 'int', default: 0 })
    quantity: number;

    /** Optional price override per SKU (if it differs from the product base price). */
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price?: number;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @ManyToOne(() => Business, (business) => business.productSkus)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    business?: Business;

    @ManyToOne(() => Business, (business) => business.modifiedProductSkus)
    @JoinColumn([{ name: 'modification_business', referencedColumnName: 'id' }])
    modificationBusiness?: Business;

    @OneToMany(() => StockMovement, (movement) => movement.productSku)
    stockMovements?: StockMovement[];
}
