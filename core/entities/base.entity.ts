import { ICoordinate } from '../common/interfaces';
import { UpdateDateColumn, Column } from 'typeorm';

export abstract class BaseEntity {
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

    @Column('point', { name: 'creation_coordinate', select: false, nullable: true })
    creationCoordinate?: ICoordinate;

    @Column('point', { name: 'modification_coordinate', select: false, nullable: true })
    modificationCoordinate?: ICoordinate;
}