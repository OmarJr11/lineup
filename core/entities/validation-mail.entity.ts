import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum } from '../common/enums';

/**
 * Represents a pending email verification record.
 * Stores a short-lived 6-digit numeric code sent to an email address
 * before the user account is created.
 *
 * The unique index on (code, status) ensures no two active records
 * can share the same verification code.
 */
@Entity('validation_mails', { schema: 'system' })
@Index('uq_validation_mails_code_active', ['code', 'status'], {
  unique: true,
  where: `status = '${StatusEnum.ACTIVE}'`,
})
export class ValidationMail extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @Column('character varying', { name: 'email', length: 255 })
  email: string;

  @Column('character varying', { name: 'code', length: 6 })
  code: string;

  @Column('boolean', { name: 'is_used', default: false })
  isUsed: boolean;

  @Column('timestamp with time zone', { name: 'expires_at' })
  expiresAt: Date;

  @Column({
    type: 'enum',
    enum: StatusEnum,
    name: 'status',
    default: StatusEnum.ACTIVE,
  })
  status: StatusEnum;
}
