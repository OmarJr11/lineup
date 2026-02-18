import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business } from './business.entity';

/**
 * Search index entity for full-text search over businesses.
 * One row per business. Holds tsvector for ranking and denormalized metrics (visits, followers, etc.).
 */
@Entity({ name: 'business_search_index' })
export class BusinessSearchIndex extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_business',unique: true })
    idBusiness: number;

    @ManyToOne(() => Business, (business) => business.businessSearchIndexes)
    @JoinColumn([{ name: 'id_business', referencedColumnName: 'id' }])
    business?: Business;

    /** Full-text search vector (name, description, path, tags). */
    @Column({ type: 'tsvector', name: 'search_vector', nullable: true })
    searchVector?: string;

    @Column('int8', { default: 0 })
    visits: number;

    @Column('int8', { default: 0 })
    followers: number;

    @Column('int8', { name: 'catalog_visits_total', default: 0 })
    catalogVisitsTotal: number;

    @Column('int8', { name: 'product_likes_total', default: 0 })
    productLikesTotal: number;

    @Column('int8', { name: 'product_visits_total', default: 0 })
    productVisitsTotal: number;
}
