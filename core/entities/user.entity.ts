import { StatusEnum } from '../common/enums/status.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProvidersEnum } from '../common/enums';
import { BusinessFollower, BusinessVisit, CatalogVisit, Currency, File, ProductReaction, ProductVisit, Role, Token, UserRole } from '.';

@Entity({ schema: 'system', name: 'users' })
export class User extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('character varying', { unique: true, length: 50 })
    email: string;

    @Column('boolean', { name: 'email_validated' })
    emailValidated?: boolean;

    @Column('character varying', { unique: true, length: 50 })
    username: string;

    @Column('character varying', { name: 'first_name', length: 255 })
    firstName: string;

    @Column('character varying', { name: 'last_name', length: 255 })
    lastName: string;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @Column({ type: 'enum', enum: ProvidersEnum })
    provider: ProvidersEnum;

    @Column('character varying', { length: 200, select: false })
    password: string;

    @OneToMany(() => Role, (role) => role.creationUser)
    createdRoles?: Role[];

    @OneToMany(() => Role, (role) => role.modificationUser)
    modifiedRoles?: Role[];

    @OneToMany(() => UserRole, (role) => role.creationUser)
    createdUserRoles?: UserRole[];

    @OneToMany(() => UserRole, (user) => user.user)
    userRoles?: UserRole[];

    @OneToMany(() => Token, (token) => token.user)
    tokens?: Token[];

    @OneToMany(() => File, (file) => file.creationUser)
    files?: File[];

    @OneToMany(() => ProductReaction, (reaction) => reaction.creationUser)
    productReactions?: ProductReaction[];

    @OneToMany(() => BusinessFollower, (follower) => follower.creationUser)
    businessFollowers?: BusinessFollower[];

    @OneToMany(() => Currency, (currency) => currency.creationUser)
    createdCurrencies?: Currency[];

    @OneToMany(() => BusinessVisit, (visit) => visit.creationUser)
    businessVisits?: BusinessVisit[];

    @OneToMany(() => ProductVisit, (visit) => visit.creationUser)
    productVisits?: ProductVisit[];

    @OneToMany(() => CatalogVisit, (visit) => visit.creationUser)
    catalogVisits?: CatalogVisit[];
}
