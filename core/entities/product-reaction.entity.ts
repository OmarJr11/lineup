import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum, ReactionTypeEnum } from '../common/enums';
import { Product, User } from '.';

@Entity({ name: 'product_reactions' })
@Index(['idProduct', 'type', 'idCreationUser'], { unique: true })
export class ProductReaction extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_product' })
    idProduct: number;

    @ManyToOne(() => Product, (product) => product.reactions)
    @JoinColumn([{ name: 'id_product', referencedColumnName: 'id' }])
    product?: Product;

    @Column({ type: 'enum', enum: ReactionTypeEnum })
    type: ReactionTypeEnum;

    @Column('int8', { name: 'id_creation_user' })
    idCreationUser: number;

    @ManyToOne(() => User, (user) => user.productReactions)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser?: User;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;
}
