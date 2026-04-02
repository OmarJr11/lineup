import { WeekDayEnum } from '../common/enums';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Business } from './business.entity';

/**
 * Stores weekly opening time ranges for each business.
 * Each row represents one opening slot in a specific day.
 */
@Entity({ name: 'business_hours' })
@Check('"opens_at_minute" >= 0 AND "opens_at_minute" <= 1439')
@Check('"closes_at_minute" >= 1 AND "closes_at_minute" <= 1440')
@Check('"opens_at_minute" < "closes_at_minute"')
@Index('idx_business_hours_business_day', ['idBusiness', 'dayOfWeek'])
@Index(
  'uq_business_hours_business_day_slot',
  ['idBusiness', 'dayOfWeek', 'slotOrder'],
  {
    unique: true,
  },
)
export class BusinessHour extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @Column('int8', { name: 'id_business' })
  idBusiness: number;

  @ManyToOne(() => Business, (business: Business) => business.businessHours)
  @JoinColumn([{ name: 'id_business', referencedColumnName: 'id' }])
  business: Business;

  @Column({ type: 'enum', enum: WeekDayEnum, name: 'day_of_week' })
  dayOfWeek: WeekDayEnum;

  @Column('int2', { name: 'opens_at_minute' })
  opensAtMinute: number;

  @Column('int2', { name: 'closes_at_minute' })
  closesAtMinute: number;

  @Column('int2', { name: 'slot_order', default: 1 })
  slotOrder: number;
}
