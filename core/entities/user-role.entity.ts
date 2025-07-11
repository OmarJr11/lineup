

import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Role, User } from '.';
import { StatusEnum } from '../common/enums';

@Entity('user_roles', { schema: 'system' })
export class UserRole {
    @Column('int8', { name: 'id_user', primary: true })
    idUser: number;

    @Column('int8', { name: 'id_role', primary: true })
    idRole: number;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @Column('int8', { name: 'id_creation_user' })
    idCreationUser: number;

    @ManyToOne(() => User, (users) => users.createdUserRoles)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser: User;

    @ManyToOne(() => Role, (role) => role.userRoles)
    @JoinColumn([{ name: 'id_role', referencedColumnName: 'id' }])
    role: Role;

    @ManyToOne(() => User, (users) => users.userRoles)
    @JoinColumn([{ name: 'id_user', referencedColumnName: 'id' }])
    user: User;
}

