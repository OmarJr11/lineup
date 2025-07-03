import { StatusEnum } from '../common/enums/status.enum';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { BusinessRole, File, Role } from './';
import { ProvidersEnum } from '../common/enums';

@Entity({ name: 'businesses' })
export class Business extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('character varying', { unique: true, length: 50 })
    email: string;

    @Column('boolean', { name: 'email_validated' })
    emailValidated?: boolean;

    @Column({ type: 'enum', enum: ProvidersEnum })
    provider: ProvidersEnum;

    @Column('character varying', { length: 200, select: false })
    password: string;

    @Column('character varying', { length: 30, nullable: true })
    telephone?: string;

    @Column('character varying', { length: 100 })
    name: string;

    @Column('character varying', { length: 255, nullable: true })
    description?: string;

    @Column('character varying', { unique: true, length: 50 })
    path: string;

    @Column({ type: 'varchar', name: 'image_code', length: 50 })
    imageCode: string;

    @ManyToOne(() => File, (files) => files.businessFiles)
    @JoinColumn([{ name: 'image_code', referencedColumnName: 'name' }])
    image?: File;

    @Column({ type: 'simple-array', nullable: true })
    tags?: string[];

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @OneToMany(() => Role, (role) => role.creationUser)
    createdRoles?: Role[];

    @OneToMany(() => Role, (role) => role.modificationUser)
    modifiedRoles?: Role[];

    @OneToMany(() => BusinessRole, (role) => role.creationBusiness)
    createdUserRoles?: BusinessRole[];

    @OneToMany(() => BusinessRole, (user) => user.business)
    businessRoles?: BusinessRole[];
}