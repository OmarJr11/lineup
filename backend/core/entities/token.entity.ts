import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '.';

@Entity('tokens', { schema: 'system' })
export class Token {
    @Column('timestamp with time zone', {
        name: 'creation_date',
        default: () => 'CURRENT_TIMESTAMP',
        select: false,
    })
    creationDate: Date;

    @Column('int8', { primary: true, name: 'id_user' })
    idUser: number;

    @ManyToOne(() => User, (user) => user.tokens)
    @JoinColumn([{ name: 'id_user', referencedColumnName: 'id' }])
    user?: User;

    @Column('character varying', { primary: true, name: 'token', length: 400 })
    token: string;

    @Column('character varying', { name: 'refresh', length: 400 })
    refresh: string;

    @Column('character varying', { name: 'creation_ip', length: 50, select: false, nullable: true })
    creationIp?: string;
}
