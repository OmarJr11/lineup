import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business, User } from '.';

/**
 * Entity that stores each visit record to a business.
 * Supports logged-in users (idCreationUser). Anonymous visits are recorded with idCreationUser null.
 */
@Entity({ name: 'business_visits' })
export class BusinessVisit extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'int8' })
    id: number;

    @Column('int8', { name: 'id_business' })
    idBusiness: number;

    @ManyToOne(() => Business, (business) => business.businessVisits)
    @JoinColumn([{ name: 'id_business', referencedColumnName: 'id' }])
    business?: Business;

    @Column('int8', { name: 'id_creation_user', nullable: true })
    idCreationUser?: number;

    @ManyToOne(() => User, (user) => user.businessVisits)
    @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
    creationUser?: User;
}
