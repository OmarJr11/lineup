import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { StatusEnum } from '../common/enum';
import { Role, Token } from '.';

@Entity('users', { schema: 'system' })
export class User {
    @PrimaryGeneratedColumn({ type: 'int8', name: 'id' })
    id: number;
    
    @Column('character varying', { name: 'mail', unique: true, length: 50 })
    mail: string;

    @Column('boolean', { name: 'email_validated' })
    emailValidated?: boolean;

    @Column('character varying', { name: 'username', unique: true, length: 50 })
    username: string;

    @Column('character varying', { name: 'first_name', length: 255 })
    firstName: string;

    @Column('character varying', { name: 'last_name', length: 255 })
    lastName: string;

    @Column({ name: 'status', type: 'enum', enum: StatusEnum })
    status: StatusEnum;

    @Column('text', { name: 'phone', nullable: true })
    phone?: string;

    // Provider to login (google, mail)
    @Column('character varying', { name: 'provider', length: 50 })
    provider: string;

    // Provider to login (google, mail)
    @Column('character varying', { name: 'img_code', length: 50, nullable: true })
    imgCode?: string;

    @Column('character varying', { name: 'password', length: 200, select: false })
    password: string;

    @Column('date', { name: 'birthday', nullable: true })
    birthday?: Date;

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

    @Column('character varying', { name: 'creation_ip', length: 50, select: false, nullable: true })
    creationIp?: string;

    @Column('character varying', {
        name: 'modification_ip',
        length: 50,
        select: false,
        nullable: true,
    })
    modificationIp?: string;

    @OneToMany(() => Token, (token) => token.user)
    tokens?: Token[];

    @OneToMany(() => Role, (role) => role.creationUser)
    createdRoles?: Role[];

    @OneToMany(() => Role, (role) => role.creationUser)
    modifiedRoles?: Role[];
}
