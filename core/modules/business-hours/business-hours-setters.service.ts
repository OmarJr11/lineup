import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { IBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { BasicService } from '../../common/services';
import { BusinessHour } from '../../entities';
import { businessHoursResponses } from '../../common/responses';
import { CreateBusinessHourItemInput } from './dto/create-business-hour-item.input';
import { UpdateBusinessHourInput } from './dto/update-business-hour.input';

/**
 * Write operations for business weekly opening slots.
 */
@Injectable()
export class BusinessHoursSettersService extends BasicService<BusinessHour> {
  private readonly logger: Logger = new Logger(
    BusinessHoursSettersService.name,
  );
  private readonly rCreate = businessHoursResponses.create;
  private readonly rUpdate = businessHoursResponses.update;
  private readonly rDelete = businessHoursResponses.delete;

  constructor(
    @InjectRepository(BusinessHour)
    private readonly businessHourRepository: Repository<BusinessHour>,
  ) {
    super(businessHourRepository);
  }

  /**
   * Creates multiple opening slots for one business.
   * @param {CreateBusinessHourItemInput[]} slots - Slots to create.
   * @param {IBusinessReq} businessReq - Current business request.
   * @returns {Promise<BusinessHour[]>} Created slots.
   */
  @Transactional()
  async createMany(
    slots: CreateBusinessHourItemInput[],
    businessReq: IBusinessReq,
  ): Promise<BusinessHour[]> {
    this.validateSlotsIntegrity(slots);
    const createdSlots: BusinessHour[] = [];
    for (const slot of slots) {
      const data: CreateBusinessHourItemInput & { idBusiness: number } = {
        ...slot,
        idBusiness: businessReq.businessId,
      };
      try {
        const createdSlot: BusinessHour = await this.save(data, businessReq);
        createdSlots.push(createdSlot);
      } catch (error) {
        LogError(
          this.logger,
          error as Error,
          this.createMany.name,
          businessReq,
        );
        throw new InternalServerErrorException(this.rCreate.error);
      }
    }
    return createdSlots;
  }

  /**
   * Updates one opening slot.
   * @param {BusinessHour} businessHour - Existing slot.
   * @param {UpdateBusinessHourInput} data - New values.
   * @param {IBusinessReq} businessReq - Current business request.
   * @returns {Promise<BusinessHour>} Updated slot.
   */
  @Transactional()
  async update(
    businessHour: BusinessHour,
    data: UpdateBusinessHourInput,
    businessReq: IBusinessReq,
  ): Promise<BusinessHour> {
    const opensAtMinute: number =
      data.opensAtMinute ?? businessHour.opensAtMinute;
    const closesAtMinute: number =
      data.closesAtMinute ?? businessHour.closesAtMinute;
    if (opensAtMinute >= closesAtMinute) {
      LogError(
        this.logger,
        new Error(this.rUpdate.invalidRange.message),
        this.update.name,
        businessReq,
      );
      throw new BadRequestException(this.rUpdate.invalidRange);
    }
    try {
      return await this.updateEntity(data, businessHour, businessReq);
    } catch (error) {
      LogError(this.logger, error as Error, this.update.name, businessReq);
      throw new InternalServerErrorException(this.rUpdate.error);
    }
  }

  /**
   * Deletes one opening slot.
   * @param {BusinessHour} businessHour - Slot to delete.
   * @returns {Promise<boolean>} True when deleted.
   */
  @Transactional()
  async remove(businessHour: BusinessHour): Promise<boolean> {
    try {
      await this.deleteEntity(businessHour);
    } catch (error) {
      LogError(this.logger, error as Error, this.remove.name);
      throw new InternalServerErrorException(this.rDelete.error);
    }
    return true;
  }

  /**
   * Validates bulk slots before insert.
   * @param {CreateBusinessHourItemInput[]} slots - Slots to validate.
   */
  private validateSlotsIntegrity(slots: CreateBusinessHourItemInput[]): void {
    const uniqueSlotKeys: Set<string> = new Set<string>();
    for (const slot of slots) {
      if (slot.opensAtMinute >= slot.closesAtMinute) {
        LogError(
          this.logger,
          new Error(this.rCreate.invalidRange.message),
          this.validateSlotsIntegrity.name,
        );
        throw new BadRequestException(this.rCreate.invalidRange);
      }
      const slotKey: string = `${slot.dayOfWeek}-${slot.slotOrder}`;
      if (uniqueSlotKeys.has(slotKey)) {
        LogError(
          this.logger,
          new Error(this.rCreate.duplicatedSlotOrder.message),
          this.validateSlotsIntegrity.name,
        );
        throw new BadRequestException(this.rCreate.duplicatedSlotOrder);
      }
      uniqueSlotKeys.add(slotKey);
    }
  }
}
