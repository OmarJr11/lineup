import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { StatusEnum, VerificationCodeChannelEnum } from '../common/enums';
import { User } from './user.entity';
import { Business } from './business.entity';

/**
 * Represents a short-lived verification code issued to an already-authenticated
 * user or business (e.g. for sensitive actions such as changing credentials,
 * confirming a phone number, or approving a transaction).
 *
 * Exactly one of `idUser` or `idBusiness` must be set per record.
 * The partial unique indexes guarantee only one active code exists per owner.
 */
@Entity('verification_codes', { schema: 'system' })
@Index('uq_verification_codes_user_active', ['idUser', 'status'], {
  unique: true,
  where: `id_user IS NOT NULL AND status = '${StatusEnum.ACTIVE}'`,
})
@Index('uq_verification_codes_business_active', ['idBusiness', 'status'], {
  unique: true,
  where: `id_business IS NOT NULL AND status = '${StatusEnum.ACTIVE}'`,
})
export class VerificationCode extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int8' })
  id: number;

  @Column('int8', { name: 'id_user', nullable: true })
  idUser?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn([{ name: 'id_user', referencedColumnName: 'id' }])
  user?: User;

  @Column('int8', { name: 'id_business', nullable: true })
  idBusiness?: number;

  @ManyToOne(() => Business, { nullable: true })
  @JoinColumn([{ name: 'id_business', referencedColumnName: 'id' }])
  business?: Business;

  /** Transport channel through which the code was delivered. */
  @Column({
    type: 'enum',
    enum: VerificationCodeChannelEnum,
    name: 'channel',
  })
  channel: VerificationCodeChannelEnum;

  /**
   * The actual destination address: an email address or a phone number,
   * depending on the value of `channel`.
   */
  @Column('character varying', { name: 'destination', length: 255 })
  destination: string;

  /** The 6-digit numeric code sent to the destination. */
  @Column('character varying', { name: 'code', length: 6 })
  code: string;

  /** Marks the code as consumed once the owner has used it successfully. */
  @Column('boolean', { name: 'is_used', default: false })
  isUsed: boolean;

  /** Timestamp after which the code is no longer valid. */
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
