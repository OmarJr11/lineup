import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services/base.service';
import { LogError } from '../../common/helpers/logger.helper';
import { verificationCodesResponses } from '../../common/responses';
import { VerificationCode } from '../../entities/verification-code.entity';

/**
 * Service responsible for querying VerificationCode records.
 */
@Injectable()
export class VerificationCodesGettersService extends BasicService<VerificationCode> {
  private readonly logger = new Logger(VerificationCodesGettersService.name);
  private readonly rVerify = verificationCodesResponses.verify;

  constructor(
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
  ) {
    super(verificationCodeRepository);
  }

  /**
   * Finds an active (unused, non-expired) verification record by destination and code.
   *
   * @param {string} code - The 6-character verification code
   * @returns {Promise<VerificationCode>} The matching verification record
   * @throws {NotFoundException} When no matching active record is found
   */
  async findActiveByDestinationAndCode(code: string): Promise<VerificationCode> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { code, isUsed: false },
      });
    } catch (error) {
      LogError(this.logger, error, this.findActiveByDestinationAndCode.name);
      throw new NotFoundException(this.rVerify.notFound);
    }
  }

  /**
   * Finds the latest verification record for a given owner (user or business).
   *
   * @param {{ idUser?: number; idBusiness?: number }} owner - The owner identifiers
   * @returns {Promise<VerificationCode | undefined>} The latest record or undefined
   */
  async findLatestByOwner({
    idUser,
    idBusiness,
  }: {
    idUser?: number;
    idBusiness?: number;
  }): Promise<VerificationCode | undefined> {
    return await this.findOneWithOptions({
      where: { ...(idUser ? { idUser } : { idBusiness }) },
      order: { creationDate: 'DESC' },
    });
  }

  /**
   * Finds an existing active (unused and non-expired) verification code for the given owner.
   *
   * @param {{ idUser?: number; idBusiness?: number }} owner - The owner identifiers
   * @returns {Promise<VerificationCode | undefined>} The active record or undefined
   */
  async findActiveByOwner(
    data: { idUser?: number; idBusiness?: number; }
  ): Promise<VerificationCode | undefined> {
    return await this.findOneWithOptions({ where: { ...data, isUsed: false } });
  }
}
