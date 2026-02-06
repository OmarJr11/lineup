import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';
import { Product, User } from '.';

@Entity({ name: 'currencies' })
export class Currency extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'varchar', length: 10, unique: true })
    code: string;

    @Column('int8', { name: 'id_creation_user' })
    idCreationUser: number;

    @ManyToOne(() => User, (user) => user.createdCurrencies)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser: User;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @OneToMany(() => Product, (product) => product.currency)
    products?: Product[];
}
