import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services/base.service';
import { LogError } from '../../common/helpers/logger.helper';
import { validationMailsResponses } from '../../common/responses';
import { ValidationMail } from '../../entities/validation-mail.entity';

/**
 * Service responsible for querying ValidationMail records.
 */
@Injectable()
export class ValidationMailsGettersService extends BasicService<ValidationMail> {
  private readonly logger = new Logger(ValidationMailsGettersService.name);
  private readonly rVerify = validationMailsResponses.verify;

  constructor(
    @InjectRepository(ValidationMail)
    private readonly validationMailRepository: Repository<ValidationMail>,
  ) {
    super(validationMailRepository);
  }

  /**
   * Finds an active (unused, non-expired) validation record by email and code.
   *
   * @param {string} email - The email address to look up
   * @param {string} code - The 6-character verification code
   * @returns {Promise<ValidationMail>} The matching validation record
   * @throws {NotFoundException} When no matching record is found
   */
  async findActiveByEmailAndCode(email: string, code: string): Promise<ValidationMail> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { email, code, isUsed: false },
      });
    } catch (error) {
      LogError(this.logger, error, this.findActiveByEmailAndCode.name);
      throw new NotFoundException(this.rVerify.notFound);
    }
  }

  /**
   * Finds the latest validation record for a given email address.
   *
   * @param {string} email - The email address to look up
   * @returns {Promise<ValidationMail | undefined>} The latest record or undefined
   */
  async findLatestByEmail(email: string): Promise<ValidationMail | undefined> {
    return await  this.findOneWithOptions({
      where: { email },
      order: { creationDate: 'DESC' },
    });
  }
}
