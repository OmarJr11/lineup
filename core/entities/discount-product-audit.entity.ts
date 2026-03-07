import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AuditOperationEnum } from '../common/enums';
import { Business, Product } from './';

/**
 * Audit entity that records changes to discount-product assignments.
 * Enables history and traceability of which discount was applied to each product.
 */
@Entity({ name: 'discount_product_audits' })
export class DiscountProductAudit {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_product' })
    idProduct: number;

    @ManyToOne(() => Product)
    @JoinColumn([{ name: 'id_product', referencedColumnName: 'id' }])
    product?: Product;

    @Column('int8', { name: 'id_discount_old', nullable: true })
    idDiscountOld?: number;

    @Column('int8', { name: 'id_discount_new', nullable: true })
    idDiscountNew?: number;

    @Column({ type: 'enum', enum: AuditOperationEnum })
    operation: AuditOperationEnum;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @ManyToOne(() => Business, (business) => business.creationDiscountProductAudits)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    creationBusiness?: Business;

    @Column('timestamp with time zone', { name: 'creation_date', default: () => 'CURRENT_TIMESTAMP' })
    creationDate: Date;
}
