import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User, Role, Permission } from './';

@Entity({ schema: 'system', name: 'role_permissions', })
export class RolePermission extends BaseEntity {
    @Column({ type: 'int8', primary: true, name: 'id_role' })
    idRole: number;

    @Column({ type: 'int8', primary: true, name: 'id_permission' })
    idPermission: number;

    @Column('int8', { name: 'id_creation_user' })
    idCreationUser: number;

    @ManyToOne(() => User, (users) => users.createdRoles)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser: User;

    @ManyToOne(() => User, (users) => users.modifiedRoles)
    @JoinColumn([{ name: 'id_modification_user', referencedColumnName: 'id' }])
    modificationUser: User;

    @ManyToOne(() => Role, (role) => role.rolePermissions)
    @JoinColumn([{ name: 'id_role', referencedColumnName: 'id' }])
    role: Role;

    @ManyToOne(() => Permission, (permission) => permission.rolePermissions)
    @JoinColumn([{ name: 'id_permission', referencedColumnName: 'id' }])
    permission: Permission;
}
