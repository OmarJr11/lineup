import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Catalog, User } from '.';

/**
 * Entity that stores each visit record to a catalog.
 * Supports logged-in users (idCreationUser). Anonymous visits are recorded with idCreationUser null.
 */
@Entity({ name: 'catalog_visits' })
export class CatalogVisit extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_catalog' })
    idCatalog: number;

    @ManyToOne(() => Catalog, (catalog) => catalog.catalogVisits)
    @JoinColumn([{ name: 'id_catalog', referencedColumnName: 'id' }])
    catalog?: Catalog;

    @Column('int8', { name: 'id_creation_user', nullable: true })
    idCreationUser?: number;

    @ManyToOne(() => User, (user) => user.catalogVisits)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser?: User;
}
