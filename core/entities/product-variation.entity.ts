import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';
import { Business, Product } from './';

@Entity({ name: 'product_variations' })
export class ProductVariation extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column('text', { array: true })
    options: string[];

    @Column('int8', { name: 'id_product' })
    idProduct: number;

    @ManyToOne(() => Product, (product) => product.variations)
    @JoinColumn([{ name: 'id_product', referencedColumnName: 'id' }])
    product?: Product;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @ManyToOne(() => Business, (business) => business.productVariations)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    business?: Business;

    @ManyToOne(() => Business, (business) => business.modifiedProductVariations)
    @JoinColumn([{ name: 'modification_business', referencedColumnName: 'id' }])
    modificationBusiness?: Business;
}
