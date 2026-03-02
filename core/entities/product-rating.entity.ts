import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';
import { Product, User } from '.';

/**
 * Entity representing a user's star rating and comment on a product.
 * A user can only rate a product once; subsequent calls update the existing rating.
 */
@Entity({ name: 'product_ratings' })
@Check(`stars >= 1 AND stars <= 5`)
export class ProductRating extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_product' })
    idProduct: number;

    @ManyToOne(() => Product, (product) => product.ratings)
    @JoinColumn([{ name: 'id_product', referencedColumnName: 'id' }])
    product?: Product;

    @Column('int8', { name: 'id_creation_user' })
    idCreationUser: number;

    @ManyToOne(() => User, (user) => user.productRatings)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser?: User;

    /** Star rating: integer between 1 and 5 inclusive. Enforced at DB level via CHECK constraint. */
    @Column({ type: 'smallint' })
    stars: number;

    /** Optional written comment accompanying the rating. */
    @Column({ type: 'text', nullable: true })
    comment?: string;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;
}
