import { StatusEnum } from '../common/enums/status.enum';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { File, User } from './';

@Entity({ name: 'businesses' })
export class Business extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('character varying', { unique: true, length: 50 })
    email: string;

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

    @Column('int8', { name: 'id_creation_user' })
    idCreationUser: number;

    @ManyToOne(() => User, (users) => users.createdRoles)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser: User;

    @ManyToOne(() => User, (users) => users.modifiedRoles)
    @JoinColumn([{ name: 'id_modification_user', referencedColumnName: 'id' }])
    modificationUser: User;
}