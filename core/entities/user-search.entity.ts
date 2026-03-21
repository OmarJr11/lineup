import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

/**
 * Entity that stores search queries performed by logged-in users.
 * Used to build personalized product collections based on search history.
 */
@Entity({ schema: 'system', name: 'user_searches' })
export class UserSearch extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @Column('int8', { name: 'id_creation_user' })
  idCreationUser: number;

  @ManyToOne(() => User, (user) => user.userSearches)
  @JoinColumn([{ name: 'id_creation_user', referencedColumnName: 'id' }])
  creationUser?: User;

  @Column({ type: 'varchar', name: 'search_term', length: 255 })
  searchTerm: string;
}
