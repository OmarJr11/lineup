import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { SocialMediasEnum, StatusEnum } from '../common/enums';
import { File, SocialNetworkBusiness, User } from '.';

@Entity({ schema: 'system', name: 'social_networks' })
export class SocialNetwork extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('character varying', { length: 100, unique: true })
    name: string;

    @Column({ type: 'enum', enum: SocialMediasEnum })
    code: SocialMediasEnum;

    @Column({ type: 'varchar', name: 'image_code', length: 255 })
    imageCode: string;

    @ManyToOne(() => File, (files) => files.socialNetworkFiles)
    @JoinColumn([{ name: 'image_code', referencedColumnName: 'name' }])
    image?: File;
    
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

    @OneToMany(() => SocialNetworkBusiness, (socialNetworkBusiness) => socialNetworkBusiness.socialNetwork)
    socialNetworkBusinesses?: SocialNetworkBusiness[];
}
