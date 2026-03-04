import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';
import { Business, ProductSku } from './';
import { StockMovementTypeEnum } from '../common/enums/stock-movement-type.enum';

/**
 * Entity representing a stock movement for inventory history.
 * Records every change in stock quantity (purchases, adjustments, sales, etc.).
 */
@Entity({ name: 'stock_movements' })
export class StockMovement extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_product_sku' })
    idProductSku: number;

    @ManyToOne(() => ProductSku, (sku) => sku.stockMovements)
    @JoinColumn([{ name: 'id_product_sku', referencedColumnName: 'id' }])
    productSku?: ProductSku;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @ManyToOne(() => Business)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    business?: Business;

    @Column({ type: 'enum', enum: StockMovementTypeEnum })
    type: StockMovementTypeEnum;

    /** Quantity change: positive for increase, negative for decrease. */
    @Column('int', { name: 'quantity_delta' })
    quantityDelta: number;

    @Column('int', { name: 'previous_quantity' })
    previousQuantity: number;

    @Column('int', { name: 'new_quantity' })
    newQuantity: number;

    @Column('text', { nullable: true })
    notes?: string;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;
}
