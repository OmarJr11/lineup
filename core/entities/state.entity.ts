import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';
import { User } from './user.entity';

/**
 * Entity representing a state/province within a country.
 * Used for geographic subdivision (e.g. Jalisco, California).
 */
@Entity({ name: 'states', schema: 'system' })
export class State extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 10, unique: true, nullable: true })
  code?: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  capital?: string;

  @Column({ type: 'enum', enum: StatusEnum, default: StatusEnum.ACTIVE })
  status: StatusEnum;

  @Column('int8', { name: 'id_creation_user' })
  idCreationUser: number;

  @ManyToOne(() => User, (user) => user.createdStates)
  @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
  creationUser?: User;

  @ManyToOne(() => User, (user) => user.modifiedStates)
  @JoinColumn([{ name: 'id_modification_user', referencedColumnName: 'id' }])
  modificationUser?: User;

  @OneToMany(() => User, (user) => user.state)
  users?: User[];
}
