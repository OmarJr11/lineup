import { StatusEnum } from '../common/enums';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Business } from '.';
import { BaseEntity } from './base.entity';

@Entity({ name: 'locations' })
export class Location extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ name: 'address_components', type: 'text' })
  addressComponents: string;
  
  @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
  status: StatusEnum;

  @Column('int8', { name: 'id_creation_business' })
  idCreationBusiness: number;

  @ManyToOne(() => Business, (business) => business.locations)
  @JoinColumn([{ name: 'id_creation_business', referencedColumnName: 'id' }])
  business?: Business;

  @ManyToOne(() => Business, (business) => business.modifiedLocations)
  @JoinColumn([{ name: 'modification_business', referencedColumnName: 'id' }])
  modificationBusiness?: Business;
}
