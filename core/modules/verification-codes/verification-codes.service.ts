import { BadRequestException, Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services/base.service';
import { VerificationCode } from '../../entities/verification-code.entity';
import { VerificationCodesGettersService } from './verification-codes-getters.service';
import { VerificationCodesSettersService } from './verification-codes-setters.service';
import { VerificationCodesMailService } from './verification-codes-mail.service';
import { CreateVerificationCodeDto } from './dto/create-verification-code.dto';
import { IUserOrBusinessReq } from '../../common/interfaces';
import { VerifyVerificationCodeDto } from './dto/verify-verification-code.dto';
import { UsersGettersService } from '../users/users.getters.service';
import { BusinessesGettersService } from '../businesses/businesses-getters.service';
import { VerificationCodeChannelEnum } from '../../common/enums';
import { businessesResponses, userResponses } from '../../common/responses';
import { LogError } from '../../common/helpers/logger.helper';

/**
 * Facade service that orchestrates verification code creation and validation
 * for authenticated users and businesses.
 */
@Injectable({ scope: Scope.REQUEST })
export class VerificationCodesService extends BasicService<VerificationCode> {
  private readonly logger = new Logger(VerificationCodesService.name);

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(VerificationCode)
    private readonly verificationCodeRepository: Repository<VerificationCode>,
    private readonly verificationCodesGettersService: VerificationCodesGettersService,
    private readonly verificationCodesSettersService: VerificationCodesSettersService,
    private readonly verificationCodesMailService: VerificationCodesMailService,
    private readonly usersService: UsersGettersService,
    private readonly businessesService: BusinessesGettersService,
  ) {
    super(verificationCodeRepository, userRequest);
  }

  /**
   * Returns an existing active code for the owner if one exists, otherwise creates a new one.
   * When the channel is EMAIL, enqueues a verification code email after creation.
   *
   * @param {CreateVerificationCodeDto} input - Owner, channel and destination data
   * @param {IUserOrBusinessReq} user - User or business making the request
   * @param {boolean} isUser - Whether the requester is a user (true) or a business (false)
   */
  @Transactional()
  async createVerificationCode(
    input: CreateVerificationCodeDto,
    user: IUserOrBusinessReq,
    isUser: boolean,
  ) {
    const idUser = isUser ? user.userId : null;
    const idBusiness = isUser ? null : user.businessId;
    if (isUser) {
      const owner = await this.usersService.findOne(idUser);
      input.destination = input.channel === VerificationCodeChannelEnum.EMAIL
        ? owner.email : null;
      input.idUser = idUser;
      const existing = await this.checkExistingCode(idUser, true);
      if (existing && !this.isExpired(existing.expiresAt)) return;
    } else {
      const owner = await this.businessesService.findOne(idBusiness);
      input.destination = input.channel === VerificationCodeChannelEnum.EMAIL
        ? owner.email : owner.telephone;
      input.idBusiness = idBusiness;
      const existing = await this.checkExistingCode(idBusiness, false);
      if (existing && !this.isExpired(existing.expiresAt)) return;
    }
    const record = await this.verificationCodesSettersService.createVerificationCode(input, user);
    if (input.channel === VerificationCodeChannelEnum.EMAIL) {
      await this.verificationCodesMailService.sendVerificationCodeEmail(record);
    }
    return record;
  }

  /**
   * Verifies a code for the given destination.
   * Throws if the code is not found, expired, or already used.
   *
   * @param {VerifyVerificationCodeDto} data - Destination and code
   * @param {IUserOrBusinessReq} user - User or business making the request
   * @param {boolean} isUser - Whether the requester is a user (true) or a business (false)
   * @returns {Promise<VerificationCode>} The verified and updated record
   */
  @Transactional()
  async verifyCode(
    data: VerifyVerificationCodeDto,
    user: IUserOrBusinessReq,
    isUser: boolean,
  ): Promise<VerificationCode> {
    const { code } = data;
    const record = await this.verificationCodesGettersService
      .findActiveByDestinationAndCode(code);

    if(isUser) {
      const owner = await this.usersService.findOne(user.userId);
      switch(record.channel) {
        case VerificationCodeChannelEnum.EMAIL:
          if(owner.email !== record.destination) {
            LogError(this.logger, 'Invalid destination', this.verifyCode.name);
            throw new BadRequestException(userResponses.verificationCode.error);
          }
          break;
        case VerificationCodeChannelEnum.PHONE:
        default:
          LogError(this.logger, 'Invalid channel', this.verifyCode.name);
          throw new BadRequestException(userResponses.verificationCode.error);
      }
    } else {
      const business = await this.businessesService.findOne(user.businessId);
      switch(record.channel) {
        case VerificationCodeChannelEnum.EMAIL:
          if(business.email !== record.destination) {
            LogError(this.logger, 'Invalid destination', this.verifyCode.name);
            throw new BadRequestException(businessesResponses.verificationCode.error);
          }
          break;
        case VerificationCodeChannelEnum.PHONE:
          if(business.telephone !== record.destination) {
            LogError(this.logger, 'Invalid destination', this.verifyCode.name);
            throw new BadRequestException(businessesResponses.verificationCode.error);
          }
          break;
        default:
          LogError(this.logger, 'Invalid channel', this.verifyCode.name);
          throw new BadRequestException(businessesResponses.verificationCode.error);
      }
    }
    
    return await this.verificationCodesSettersService.verifyCode(record, user);
  }

  
  /**
   * Checks whether a verification code expiry date has passed.
   *
   * @param {Date} expiresAt - The expiry timestamp to evaluate
   * @returns {boolean} True if the code is expired
   */
  private isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Checks if there is an existing active code for the owner.
   *
   * @param {number} id - The ID of the owner
   * @param {boolean} isUser - Whether the owner is a user or a business
   * @returns {Promise<VerificationCode>} The existing code or undefined
   */
  private async checkExistingCode(id: number, isUser: boolean): Promise<VerificationCode> {
    const data = isUser ? { idUser: id } : { idBusiness: id };
    return await this.verificationCodesGettersService.findActiveByOwner(data);
  }
}
