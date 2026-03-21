import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProductTag } from './product-tag.entity';
import { Business } from '.';

/**
 * Tag entity for categorizing products.
 * Normalized storage: each unique tag name is stored once.
 * Products relate to tags via ManyToMany (product_tags junction table).
 */
@Entity({ name: 'tags' })
export class Tag extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  /** URL-friendly identifier for filtering (e.g. /products?tag=pan-artesanal). */
  @Column({ type: 'varchar', length: 120, unique: true })
  slug: string;

  @OneToMany(() => ProductTag, (productTag) => productTag.tag)
  productTags?: ProductTag[];

  @Column('int8', { name: 'id_creation_business' })
  idCreationBusiness: number;

  @ManyToOne(() => Business, (business) => business.tags)
  @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
  creationBusiness?: Business;
}
