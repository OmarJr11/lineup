import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Product, User } from '.';

/**
 * Entity that stores each visit record to a product.
 * Supports logged-in users (idCreationUser). Anonymous visits are recorded with idCreationUser null.
 */
@Entity({ name: 'product_visits' })
export class ProductVisit extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_product' })
    idProduct: number;

    @ManyToOne(() => Product, (product) => product.productVisits)
    @JoinColumn([{ name: 'id_product', referencedColumnName: 'id' }])
    product?: Product;

    @Column('int8', { name: 'id_creation_user', nullable: true })
    idCreationUser?: number;

    @ManyToOne(() => User, (user) => user.productVisits)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser?: User;
}
