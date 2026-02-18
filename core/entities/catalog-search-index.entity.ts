import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business } from './business.entity';
import { Catalog } from './catalog.entity';

/**
 * Search index entity for full-text search over catalogs.
 * One row per catalog. Holds tsvector for ranking, idBusiness owner, and denormalized metrics.
 */
@Entity({ name: 'catalog_search_index' })
export class CatalogSearchIndex extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_catalog',unique: true })
    idCatalog: number;

    @ManyToOne(() => Catalog, (catalog) => catalog.catalogSearchIndexes)
    @JoinColumn([{ name: 'id_catalog', referencedColumnName: 'id' }])
    catalog?: Catalog;

    @Column('int8', { name: 'id_business' })
    idBusiness: number;

    @ManyToOne(() => Business, (business) => business.catalogSearchIndexes)
    @JoinColumn([{ name: 'id_business', referencedColumnName: 'id' }])
    business?: Business;

    /** Full-text search vector (title, path, tags). */
    @Column({ type: 'tsvector', name: 'search_vector', nullable: true })
    searchVector?: string;

    @Column('int8', { default: 0 })
    visits: number;

    @Column('int8', { name: 'product_likes_total', default: 0 })
    productLikesTotal: number;

    @Column('int8', { name: 'product_visits_total', default: 0 })
    productVisitsTotal: number;
}
