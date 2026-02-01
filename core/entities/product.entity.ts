import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';
import { Business, Catalog, ProductFile } from '.';
import { ProductVariation } from './product-variation.entity';

@Entity({ name: 'products' })
export class Product extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column({ type: 'varchar', length: 255 })
    title: string;

    @Column({ type: 'varchar', length: 255 })
    subtitle: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price?: number;

    @Column('int8', { default: 0 })
    likes: number;

    @Column('int8', { name: 'id_catalog' })
    idCatalog: number;

    @ManyToOne(() => Catalog, (catalog) => catalog.products)
    @JoinColumn([{ name: 'id_catalog', referencedColumnName: 'id' }])
    catalog?: Catalog;

    @Column('simple-array')
    tags: string[];

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @ManyToOne(() => Business, (business) => business.products)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    business?: Business;

    @ManyToOne(() => Business, (business) => business.modifiedProducts)
    @JoinColumn([{ name: 'modification_business', referencedColumnName: 'id' }])
    modificationBusiness?: Business;

    @OneToMany(() => ProductFile, (productFile) => productFile.product)
    productFiles?: ProductFile[];

    @OneToMany(() => ProductVariation, (variation) => variation.product)
    variations?: ProductVariation[];
}
