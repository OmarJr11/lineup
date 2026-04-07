import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VariationOptions } from '../common/types';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';
import { Business, Currency, Product, StockMovement } from './';

/**
 * Entity representing a Stock Keeping Unit (SKU) for a product.
 * Each SKU represents a unique combination of variation options (e.g. Color: "Amarillo", Talla: "M")
 * or a product without variations. The quantity field holds the stock for that combination.
 */
@Entity({ name: 'product_skus' })
@Check(
  `(price IS NULL AND id_currency IS NULL) OR (price IS NOT NULL AND id_currency IS NOT NULL)`,
)
@Index('uq_product_skus_sku_code_not_deleted', ['skuCode'], {
  unique: true,
  where: `status != '${StatusEnum.DELETED}'`,
})
export class ProductSku extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @Column('int8', { name: 'id_product' })
  idProduct: number;

  @ManyToOne(() => Product, (product) => product.skus)
  @JoinColumn([{ name: 'id_product', referencedColumnName: 'id' }])
  product?: Product;

  /** Unique code for the SKU (e.g. "P1-AMAR-M"). Enforced unique only when status is not deleted. */
  @Column({ type: 'varchar', name: 'sku_code', length: 100 })
  skuCode: string;

  /**
   * Selected options per variation type.
   * Example: { "Color": "Amarillo", "Talla": "M" }.
   * Empty object {} for products without variations.
   */
  @Column({ type: 'jsonb', name: 'variation_options', default: {} })
  variationOptions: VariationOptions;

  /** Stock quantity for this SKU. Null when not yet set (e.g. on product creation). */
  @Column({ type: 'int', nullable: true })
  quantity?: number | null;

  /** Price for this SKU. Must be paired with idCurrency when set. */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column('int8', { name: 'id_currency', nullable: true })
  idCurrency?: number;

  @ManyToOne(() => Currency, (currency) => currency.productSkus, {
    nullable: true,
  })
  @JoinColumn([{ name: 'id_currency', referencedColumnName: 'id' }])
  currency?: Currency;

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
