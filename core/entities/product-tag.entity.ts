import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Product } from './product.entity';
import { Tag } from './tag.entity';

/**
 * Junction entity for Product-Tag many-to-many relationship.
 * Maps to product_tags table. Each row links one product to one tag.
 */
@Entity({ name: 'product_tags' })
export class ProductTag {
    @PrimaryColumn('int8', { name: 'id_product' })
    idProduct: number;

    @PrimaryColumn('int8', { name: 'id_tag' })
    idTag: number;

    @ManyToOne(() => Product, (product) => product.productTags, { onDelete: 'CASCADE' })
    @JoinColumn([{ name: 'id_product', referencedColumnName: 'id' }])
    product?: Product;

    @ManyToOne(() => Tag, (tag) => tag.productTags, { onDelete: 'CASCADE' })
    @JoinColumn([{ name: 'id_tag', referencedColumnName: 'id' }])
    tag?: Tag;
}
