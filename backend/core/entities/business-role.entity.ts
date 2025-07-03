

import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Business, Role } from '.';
import { StatusEnum } from '../common/enums';

@Entity('business_roles', { schema: 'system' })
export class BusinessRole {
    @Column('int8', { name: 'id_business', primary: true })
    idBusiness: number;

    @Column('int8', { name: 'id_role', primary: true })
    idRole: number;

    @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
    status: StatusEnum;

    @Column('int8', { name: 'id_creation_business' })
    idCreationBusiness: number;

    @ManyToOne(() => Business, (business) => business.createdUserRoles)
    @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
    creationBusiness: Business;

    @ManyToOne(() => Role, (role) => role.userRoles)
    @JoinColumn([{ name: 'id_role', referencedColumnName: 'id' }])
    role: Role;

    @ManyToOne(() => Business, (business) => business.businessRoles)
    @JoinColumn([{ name: 'id_business', referencedColumnName: 'id' }])
    business: Business;
}

