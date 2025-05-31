import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { RolesEnum, StatusEnum } from '../common/enum';
import { User, UserRole } from '.';

@Entity('roles', { schema: 'system' })
export class Role {
    @PrimaryGeneratedColumn({ type: 'int8', name: 'id' })
    id: number;

    @Column({ enum: RolesEnum, type: 'enum', name: 'code', unique: true })
    code: RolesEnum;

    @Column('character varying', { name: 'name', length: 255 })
    name: string;

    @Column({ name: 'status', type: 'enum', enum: StatusEnum })
    status: StatusEnum;

    @Column('timestamp with time zone', {
        name: 'creation_date',
        default: () => 'CURRENT_TIMESTAMP',
        select: false,
    })
    creationDate: Date;

    @UpdateDateColumn({
        type: 'timestamp with time zone',
        name: 'modification_date',
        nullable: true,
        select: false,
    })
    modificationDate?: Date;

    @Column('int8', { name: 'id_creation_user' })
    idCreationUser: number;

    @ManyToOne(() => User, (users) => users.createdRoles)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser: User;

    @ManyToOne(() => User, (users) => users.modifiedRoles)
    @JoinColumn([{ name: 'id_modification_user', referencedColumnName: 'id' }])
    modificationUser: User;

    @OneToMany(() => UserRole, (userRoles) => userRoles.role)
    userRoles: UserRole[];

    @Column('character varying', { name: 'creation_ip', length: 50, select: false, nullable: true })
    creationIp?: string;

    @Column('character varying', {
        name: 'modification_ip',
        length: 50,
        select: false,
        nullable: true,
    })
    modificationIp?: string;
}
