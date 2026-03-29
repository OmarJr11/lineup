import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services';
import { IBusinessReq } from '../../common/interfaces';
import { BusinessHour } from '../../entities';
import { BusinessHoursGettersService } from './business-hours-getters.service';
import { BusinessHoursSettersService } from './business-hours-setters.service';
import { CreateBusinessHoursInput } from './dto/create-business-hours.input';
import { UpdateBusinessHourInput } from './dto/update-business-hour.input';

/**
 * Application service for business opening hours.
 */
@Injectable({ scope: Scope.REQUEST })
export class BusinessHoursService extends BasicService<BusinessHour> {
  private readonly logger = new Logger(BusinessHoursService.name);

  constructor(
    @Inject(REQUEST)
    private readonly businessRequest: Request,
    @InjectRepository(BusinessHour)
    private readonly businessHourRepository: Repository<BusinessHour>,
    private readonly businessHoursGettersService: BusinessHoursGettersService,
    private readonly businessHoursSettersService: BusinessHoursSettersService,
  ) {
    super(businessHourRepository, businessRequest);
  }

  /**
   * Creates multiple opening slots for the current business.
   * @param {CreateBusinessHoursInput} data - Bulk create payload.
   * @param {IBusinessReq} businessReq - Current business request.
   * @returns {Promise<BusinessHour[]>} Ordered created list.
   */
  @Transactional()
  async create(
    data: CreateBusinessHoursInput,
    businessReq: IBusinessReq,
  ): Promise<BusinessHour[]> {
    await this.businessHoursSettersService.createMany(data.slots, businessReq);
    return await this.businessHoursGettersService.findAllByBusiness(
      businessReq.businessId,
    );
  }

  /**
   * Updates one opening slot from the current business.
   * @param {UpdateBusinessHourInput} data - Update payload.
   * @param {IBusinessReq} businessReq - Current business request.
   * @returns {Promise<BusinessHour>} Updated slot.
   */
  @Transactional()
  async update(
    data: UpdateBusinessHourInput,
    businessReq: IBusinessReq,
  ): Promise<BusinessHour> {
    const businessHour =
      await this.businessHoursGettersService.findOneByIdAndBusiness(
        data.id,
        businessReq.businessId,
      );
    await this.businessHoursSettersService.update(
      businessHour,
      data,
      businessReq,
    );
    return await this.businessHoursGettersService.findOneByIdAndBusiness(
      data.id,
      businessReq.businessId,
    );
  }

  /**
   * Deletes one opening slot from the current business.
   * @param {number} id - Slot ID.
   * @param {IBusinessReq} businessReq - Current business request.
   * @returns {Promise<boolean>} True when deleted.
   */
  @Transactional()
  async remove(id: number, businessReq: IBusinessReq): Promise<boolean> {
    const businessHour =
      await this.businessHoursGettersService.findOneByIdAndBusiness(
        id,
        businessReq.businessId,
      );
    await this.businessHoursSettersService.remove(businessHour);
    return true;
  }

  /**
   * Gets ordered schedule for any business.
   * @param {number} idBusiness - Business ID.
   * @returns {Promise<BusinessHour[]>} Ordered schedule.
   */
  async findAllByBusiness(idBusiness: number): Promise<BusinessHour[]> {
    return await this.businessHoursGettersService.findAllByBusiness(idBusiness);
  }

  /**
   * Gets ordered schedule for current business.
   * @param {IBusinessReq} businessReq - Current business request.
   * @returns {Promise<BusinessHour[]>} Ordered schedule.
   */
  async findAllMyBusinessHours(
    businessReq: IBusinessReq,
  ): Promise<BusinessHour[]> {
    return await this.businessHoursGettersService.findAllByBusiness(
      businessReq.businessId,
    );
  }
}
