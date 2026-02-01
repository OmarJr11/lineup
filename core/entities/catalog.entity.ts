import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Business, File, Product } from '.';
import { StatusEnum } from '../common/enums';
import { BaseEntity } from './base.entity';

@Entity({ name: 'catalogs' })
export class Catalog extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;
    
    @Column({ type: 'varchar', length: 150 })
    title: string;

    @Column({ type: 'varchar', name: 'image_code', length: 255, nullable: true })
    imageCode?: string;

    @ManyToOne(() => File, (files) => files.catalogFiles)
    @JoinColumn([{ name: 'image_code', referencedColumnName: 'name' }])
    image?: File;
    
    @Column({ type: 'varchar', length: 255, unique: true })
    path: string;
    
    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @Column('text', { array: true, nullable: true })
    tags?: string[];

    @ManyToOne(() => Business, (business) => business.catalogs)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    business?: Business;

    @ManyToOne(() => Business, (business) => business.modifiedCatalogs)
    @JoinColumn([{ name: 'modification_business', referencedColumnName: 'id' }])
    modificationBusiness?: Business;

    @OneToMany(() => Product, (product) => product.catalog)
    products?: Product[];
}
