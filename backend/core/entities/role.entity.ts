import { RolesCodesEnum, StatusEnum } from '../common/enums';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from './base.entity';
import { UserRole, RolePermission, BusinessRole } from './';

@Entity({ schema: 'system', name: 'roles' })
export class Role extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column({ type: 'enum', enum: RolesCodesEnum, unique: true })
    code: RolesCodesEnum;

    @Column('character varying', { length: 100 })
    description: string;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @Column('int8', { name: 'id_creation_user' })
    idCreationUser: number;

    @ManyToOne(() => User, (users) => users.createdRoles)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser: User;

    @ManyToOne(() => User, (users) => users.modifiedRoles)
    @JoinColumn([{ name: 'id_modification_user', referencedColumnName: 'id' }])
    modificationUser: User;

    @OneToMany(() => UserRole, (user) => user.role)
    userRoles: UserRole[];

    @OneToMany(() => BusinessRole, (business) => business.role)
    businessRoles: BusinessRole[];

    @OneToMany(() => RolePermission, (user) => user.role)
    rolePermissions: RolePermission[];
}
