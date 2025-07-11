import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';
import { RolePermission, User } from '.';

@Entity({ schema: 'system', name: 'permissions', })
export class Permission extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('character varying', { unique: true })
    code: string;

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

    @OneToMany(() => RolePermission, (user) => user.role)
    rolePermissions: RolePermission[];
}
