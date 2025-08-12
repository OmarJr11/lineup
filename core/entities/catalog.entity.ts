import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Business, Product } from '.';
import { StatusEnum } from '../common/enums';
import { BaseEntity } from './base.entity';

@Entity({ name: 'catalogs' })
export class Catalog extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;
    
    @Column({ type: 'varchar', length: 255 })
    title: string;
    
    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @ManyToOne(() => Business, (business) => business.createdCatalogs)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    creationBusiness?: Business;

    @ManyToOne(() => Business, (business) => business.modifiedCatalogs)
    @JoinColumn([{ name: 'modification_business', referencedColumnName: 'id' }])
    modificationBusiness?: Business;

    @OneToMany(() => Product, (product) => product.catalog)
    products?: Product[];
}
