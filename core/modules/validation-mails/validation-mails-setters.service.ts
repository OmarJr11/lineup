import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services/base.service';
import { LogError } from '../../common/helpers/logger.helper';
import { validationMailsResponses } from '../../common/responses';
import { ValidationMail } from '../../entities/validation-mail.entity';
import { ValidationMailsGettersService } from './validation-mails-getters.service';
import { Transactional } from 'typeorm-transactional-cls-hooked';

/** Length of the numeric verification code */
const VERIFICATION_CODE_LENGTH = 6 as const;

/** Number of minutes before a verification code expires */
const CODE_EXPIRY_MINUTES = 10 as const;

/**
 * Service responsible for creating and verifying ValidationMail records.
 */
@Injectable()
export class ValidationMailsSettersService extends BasicService<ValidationMail> {
  private readonly logger = new Logger(ValidationMailsSettersService.name);
  private readonly rCreate = validationMailsResponses.create;
  private readonly rVerify = validationMailsResponses.verify;

  constructor(
    @InjectRepository(ValidationMail)
    private readonly validationMailRepository: Repository<ValidationMail>,
  ) {
    super(validationMailRepository);
  }

  /**
   * Creates a new validation record for the given email address.
   * Generates a random 6-character code and sets an expiry time.
   *
   * @param {string} email - The email address to generate a code for
   * @returns {Promise<ValidationMail>} The persisted validation record
   * @throws {InternalServerErrorException} When the record cannot be saved
   */
  @Transactional()
  async createValidationCode(email: string): Promise<ValidationMail> {
    const code = this.generateCode();
    const expiresAt = this.buildExpiryDate();
    try {
      const data = { email, code, expiresAt, isUsed: false }; 
      return await this.save(data);
    } catch (error) {
      LogError(this.logger, error, this.createValidationCode.name);
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }

  /**
   * Verifies a code for a given email address.
   * Marks the record as used if the code is valid and not expired.
   *
   * @param {ValidationMail} record - The record to verify
   * @returns {Promise<ValidationMail>} The verified and updated record
   * @throws {NotFoundException} When no matching record is found
   * @throws {BadRequestException} When the code is expired or already used
   */
  async verifyCode(record: ValidationMail): Promise<ValidationMail> {
    this.assertNotExpired(record);
    return await this.markAsUsed(record);
  }

  /**
   * Asserts that the validation record has not expired.
   *
   * @param {ValidationMail} record - The record to check
   * @throws {BadRequestException} When the code has expired
   */
  private assertNotExpired(record: ValidationMail): void {
    if (new Date() > record.expiresAt) {
      LogError(this.logger, this.rVerify.expired.message, this.verifyCode.name);
      throw new BadRequestException(this.rVerify.expired);
    }
  }

  /**
   * Marks a validation record as used in the database.
   *
   * @param {ValidationMail} record - The record to mark as used
   * @returns {Promise<ValidationMail>} The updated record
   * @throws {InternalServerErrorException} When the update fails
   */
  @Transactional()
  private async markAsUsed(record: ValidationMail): Promise<ValidationMail> {
    record.isUsed = true;
    try {
      return await this.save(record);
    } catch (error) {
      LogError(this.logger, error, this.markAsUsed.name);
      throw new InternalServerErrorException(this.rVerify.invalid);
    }
  }

  /**
   * Generates a random alphanumeric code of the configured length.
   *
   * @returns {string} A random 6-character code
   */
  private generateCode(): string {
    const max = Math.pow(10, VERIFICATION_CODE_LENGTH);
    const min = Math.pow(10, VERIFICATION_CODE_LENGTH - 1);
    return String(Math.floor(Math.random() * (max - min)) + min);
  }

  /**
   * Builds the expiry date based on the configured expiry minutes.
   *
   * @returns {Date} The expiry timestamp
   */
  private buildExpiryDate(): Date {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRY_MINUTES);
    return expiresAt;
  }
}
