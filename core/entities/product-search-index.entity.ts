import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business, Catalog, Product } from '.';

/**
 * Search index entity for full-text search over products.
 * One row per product. Holds tsvector for ranking, idBusiness owner, and denormalized likes/visits.
 */
@Entity({ name: 'product_search_index' })
@Index(['idProduct'], { unique: true })
export class ProductSearchIndex extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_product' })
    idProduct: number;

    @ManyToOne(() => Product, (product) => product.productSearchIndexes)
    @JoinColumn([{ name: 'id_product', referencedColumnName: 'id' }])
    product?: Product;

    @Column('int8', { name: 'id_business' })
    idBusiness: number;

    @ManyToOne(() => Business, (business) => business.productSearchIndexes)
    @JoinColumn([{ name: 'id_business', referencedColumnName: 'id' }])
    business?: Business;

    @Column('int8', { name: 'id_catalog' })
    idCatalog: number;

    @ManyToOne(() => Catalog, (catalog) => catalog.productSearchIndexes)
    @JoinColumn([{ name: 'id_catalog', referencedColumnName: 'id' }])
    catalog?: Catalog;

    /** Full-text search vector (title, subtitle, description, tags). */
    @Column({ type: 'tsvector', name: 'search_vector', nullable: true })
    searchVector?: string;

    @Column('int8', { default: 0 })
    likes: number;

    @Column('int8', { default: 0 })
    visits: number;
}
