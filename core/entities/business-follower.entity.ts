import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';
import { Business, User } from '.';

@Entity({ name: 'business_followers' })
@Index(['idBusiness', 'idCreationUser'], { unique: true })
export class BusinessFollower extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_business' })
    idBusiness: number;

    @ManyToOne(() => Business, (business) => business.followers)
    @JoinColumn([{ name: 'id_business', referencedColumnName: 'id' }])
    business?: Business;

    @Column('int8', { name: 'id_creation_user' })
    idCreationUser: number;

    @ManyToOne(() => User, (user) => user.businessFollowers)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser?: User;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;
}
