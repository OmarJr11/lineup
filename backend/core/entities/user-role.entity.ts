

import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Role, User } from '.';

@Entity('user_roles', { schema: 'system' })
export class UserRole {
    @Column('int8', { name: 'id_user', primary: true })
    idUser: number;

    @Column('int8', { name: 'id_role', primary: true })
    idRole: number;

    @ManyToOne(() => Role, (role) => role.userRoles)
    @JoinColumn([{ name: 'id_role', referencedColumnName: 'id' }])
    role: Role;

    @ManyToOne(() => User, (users) => users.userRoles)
    @JoinColumn([{ name: 'id_user', referencedColumnName: 'id' }])
    user: User;

    @Column('timestamp with time zone', {
        name: 'creation_date',
        default: () => 'CURRENT_TIMESTAMP',
        select: false,
    })
    creationDate: Date;

    @Column('int8', { name: 'id_creation_user' })
    idCreationUser: number;

    @ManyToOne(() => User, (users) => users.createdRoles)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser: User;

    @Column('character varying', {
        name: 'creation_ip',
        length: 50,
        select: false,
        nullable: true
    })
    creationIp?: string;
}

