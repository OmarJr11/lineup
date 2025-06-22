import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '.';
import { BaseEntity } from './base.entity';

@Entity('tokens', { schema: 'system' })
export class Token extends BaseEntity {
    @Column('int8', { primary: true, name: 'id_user' })
    idUser: number;

    @ManyToOne(() => User, (user) => user.tokens)
    @JoinColumn([{ name: 'id_user', referencedColumnName: 'id' }])
    user?: User;

    @Column('character varying', { primary: true, name: 'token', length: 400 })
    token: string;

    @Column('character varying', { name: 'refresh', length: 400 })
    refresh: string;
}