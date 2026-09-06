import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Cart, Product, ProductSku } from '.';

@Entity({ name: 'cart_items' })
/** Represents a product or SKU selected in a user's business-specific cart. */
export class CartItem extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @Column('int8', { name: 'id_cart' })
  idCart: number;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn([{ name: 'id_cart', referencedColumnName: 'id' }])
  cart?: Cart;

  @Column('int8', { name: 'id_product' })
  idProduct: number;

  @ManyToOne(() => Product, (product) => product.id)
  @JoinColumn([{ name: 'id_product', referencedColumnName: 'id' }])
  product?: Product;

  @Column('int8', { name: 'id_product_sku', nullable: true })
  idProductSku?: number;

  @ManyToOne(() => ProductSku, (sku) => sku.id)
  @JoinColumn([{ name: 'id_product_sku', referencedColumnName: 'id' }])
  productSku?: ProductSku;

  @Column('int4')
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  subtotal: number;

  @Column({ type: 'jsonb', nullable: true })
  variationOptions?: Record<string, string>;
}
