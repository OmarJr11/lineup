import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business, Catalog, Product } from '.';

/**
 * Search index entity for full-text search over products.
 * One row per product. Holds tsvector for ranking (title, subtitle, description, status,
 * variations, skus from Product, ProductVariation, ProductSku), idBusiness owner, and denormalized likes/visits.
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

    /**
     * Full-text search vector. Contains: title, subtitle, description, status,
     * idCurrency, variations (title + options), skus (skuCode + variationOptions).
     */
    @Column({ type: 'tsvector', name: 'search_vector', nullable: true })
    searchVector?: string;

    @Column('int8', { default: 0 })
    likes: number;

    @Column('int8', { default: 0 })
    visits: number;

    /**
     * Denormalized average star rating (0.00–5.00).
     * Carries the highest weight when ranking search results by relevance.
     */
    @Column({ type: 'decimal', precision: 3, scale: 2, name: 'rating_average', default: 0 })
    ratingAverage: number;

    /** Denormalized from Product SKUs (min price). Optional, used for filtering search by price range. */
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    price?: number;

    /** Denormalized from Business.locations: concatenated formatted addresses for filtering by location. */
    @Column({ type: 'text', name: 'locations_text', nullable: true })
    locationsText?: string;
}
