import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services/base.service';
import { LogError } from '../../common/helpers/logger.helper';
import { verificationCodesResponses } from '../../common/responses';
import { VerificationCode } from '../../entities/verification-code.entity';
import { CreateVerificationCodeDto } from './dto/create-verification-code.dto';
import { IUserOrBusinessReq } from '../../common/interfaces';
import { StatusEnum } from '../../common/enums';

/** Length of the numeric verification code */
const VERIFICATION_CODE_LENGTH = 6 as const;

/** Number of minutes before a verification code expires */
const CODE_EXPIRY_MINUTES = 10 as const;

/**
 * Service responsible for creating and verifying VerificationCode records.
 */
@Injectable()
export class VerificationCodesSettersService extends BasicService<VerificationCode> {
  private readonly logger = new Logger(VerificationCodesSettersService.name);
  private readonly rCreate = verificationCodesResponses.create;
  private readonly rVerify = verificationCodesResponses.verify;

  constructor(
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
  ) {
    super(verificationCodeRepository);
  }

  /**
   * Creates a new verification code record for the given owner and destination.
   *
   * @param {ICreateVerificationCodeInput} input - Owner, channel and destination data
   * @param {IUserOrBusinessReq} user - User or business making the request
   * @returns {Promise<VerificationCode>} The persisted verification record
   * @throws {InternalServerErrorException} When the record cannot be saved
   */
  @Transactional()
  async createVerificationCode(
    input: CreateVerificationCodeDto,
    user: IUserOrBusinessReq
  ): Promise<VerificationCode> {
    const code = this.generateCode();
    const expiresAt = this.buildExpiryDate();
    try {
      const data = { ...input, code, expiresAt, isUsed: false };
      return await this.save(data, user);
    } catch (error) {
      LogError(this.logger, error, this.createVerificationCode.name);
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }

  /**
   * Verifies a code record.
   * Asserts it has not expired and marks it as used.
   *
   * @param {VerificationCode} record - The record to verify
   * @param {IUserOrBusinessReq} user - User or business making the request
   * @returns {Promise<VerificationCode>} The updated record
   * @throws {BadRequestException} When the code has expired
   * @throws {InternalServerErrorException} When the update fails
   */
  async verifyCode(record: VerificationCode, user: IUserOrBusinessReq): Promise<VerificationCode> {
    this.assertNotExpired(record);
    return await this.markAsUsed(record, user);
  }

  /**
   * Asserts that the verification record has not expired.
   *
   * @param {VerificationCode} record - The record to check
   * @throws {BadRequestException} When the code has expired
   */
  private assertNotExpired(record: VerificationCode): void {
    if (new Date() > record.expiresAt) {
      LogError(this.logger, this.rVerify.expired.message, this.verifyCode.name);
      throw new BadRequestException(this.rVerify.expired);
    }
  }

  /**
   * Marks a verification record as used in the database.
   *
   * @param {VerificationCode} record - The record to mark as used
   * @param {IUserOrBusinessReq} user - User or business making the request
   * @returns {Promise<VerificationCode>} The updated record
   * @throws {InternalServerErrorException} When the update fails
   */
  @Transactional()
  private async markAsUsed(record: VerificationCode, user: IUserOrBusinessReq): Promise<VerificationCode> {
    try {
      const data = { isUsed: true, status: StatusEnum.COMPLETED };
      return await this.updateEntity(data, record, user);
    } catch (error) {
      LogError(this.logger, error, this.markAsUsed.name);
      throw new InternalServerErrorException(this.rVerify.invalid);
    }
  }

  /**
   * Generates a random 6-digit numeric code.
   *
   * @returns {string} A random 6-digit code
   */
  private generateCode(): string {
    const max = Math.pow(10, VERIFICATION_CODE_LENGTH);
    const min = Math.pow(10, VERIFICATION_CODE_LENGTH - 1);
    return String(Math.floor(Math.random() * (max - min)) + min);
  }

  /**
   * Builds the expiry date based on the configured expiry minutes.
   * Uses millisecond arithmetic to avoid timezone-related offset issues.
   *
   * @returns {Date} The expiry timestamp
   */
  private buildExpiryDate(): Date {
    return new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
  }
}
