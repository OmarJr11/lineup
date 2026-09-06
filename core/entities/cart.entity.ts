import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business, User, CartItem } from '.';

@Unique('unique_user_business_cart', ['idCreationUser', 'idBusiness'])
@Entity({ name: 'carts' })
/** Represents the independent cart owned by one user for one business. */
export class Cart extends BaseEntity {
  /** Database identifier. @type {number} */
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  /** Identifier of the cart owner. @type {number} */
  @Column('int8', { name: 'id_creation_user' })
  idCreationUser: number;

  /** Cart owner relation. @type {User | undefined} */
  @ManyToOne(() => User, (user) => user.carts)
  @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
  creationUser?: User;

  /** Identifier of the business associated with this cart. @type {number} */
  @Column('int8', { name: 'id_business' })
  idBusiness: number;

  @ManyToOne(() => Business, (business) => business.carts)
  @JoinColumn([{ name: 'id_business', referencedColumnName: 'id' }])
  business?: Business;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart)
  items?: CartItem[];

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column('int4', { default: 0 })
  itemsCount: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastActivityDate?: Date;
}
