import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Business } from '.';

@Entity({ name: 'files', schema: 'system' })
export class File extends BaseEntity {
    @Column('character varying', { primary: true, length: 50 })
    name: string;

    @Column('character varying', { length: 10 })
    extension: string;

    @Column('character varying', { length: 50 })
    directory: string;

    @Column('text', { name: 'url' })
    url: string;

    @Column('int8', { name: 'id_creation_user' })
    idCreationUser: number;

    @ManyToOne(() => User, (users) => users.files)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser: User;

    /*@Column('jsonb', { name: 'thumbnails', nullable: true })
    thumbnails?: ThumbnailsInterface;
    */
    @Column({ type: 'simple-array', nullable: true })
    tags: string[];

    @OneToMany(() => Business, (business) => business.image)
    businessFiles?: Business[];
}
