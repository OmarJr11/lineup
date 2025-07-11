import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Business, User } from '.';
import { BaseEntity } from './base.entity';

@Entity('tokens', { schema: 'system' })
export class Token extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_user', nullable: true })
    idUser: number;
    
    @ManyToOne(() => User, (user) => user.tokens)
    @JoinColumn([{ name: 'id_user', referencedColumnName: 'id' }])
    user?: User;

    @Column('int8', { name: 'id_business', nullable: true })
    idBusiness: number;

    @ManyToOne(() => Business, (business) => business.tokens)
    @JoinColumn([{ name: 'id_business', referencedColumnName: 'id' }])
    business?: Business;

    @Column('character varying', { name: 'token', length: 400 })
    token: string;

    @Column('character varying', { name: 'refresh', length: 400 })
    refresh: string;
}