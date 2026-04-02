import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { BusinessHour } from '../../entities';
import { WeekDayEnum } from '../../common/enums/week-day.enum';
import { LogError } from '../../common/helpers/logger.helper';
import { businessHoursResponses } from '../../common/responses';

/**
 * Read operations for business weekly opening slots.
 */
@Injectable()
export class BusinessHoursGettersService extends BasicService<BusinessHour> {
  private readonly logger = new Logger(BusinessHoursGettersService.name);
  private readonly rList = businessHoursResponses.list;

  constructor(
    @InjectRepository(BusinessHour)
    private readonly businessHourRepository: Repository<BusinessHour>,
  ) {
    super(businessHourRepository);
  }

  /**
   * Gets one opening slot by ID.
   * @param {number} id - Slot ID.
   * @returns {Promise<BusinessHour>} The found slot.
   */
  async findOne(id: number): Promise<BusinessHour> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { id },
      });
    } catch (error) {
      LogError(this.logger, error as Error, this.findOne.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Gets one opening slot by ID and business ownership.
   * @param {number} id - Slot ID.
   * @param {number} idBusiness - Business owner ID.
   * @returns {Promise<BusinessHour>} The found slot.
   */
  async findOneByIdAndBusiness(
    id: number,
    idBusiness: number,
  ): Promise<BusinessHour> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { id, idBusiness },
      });
    } catch (error) {
      LogError(this.logger, error as Error, this.findOneByIdAndBusiness.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Gets all slots for a business ordered by day and slot order.
   * @param {number} idBusiness - Business ID.
   * @returns {Promise<BusinessHour[]>} Ordered slot list.
   */
  async findAllByBusiness(idBusiness: number): Promise<BusinessHour[]> {
    const dayOrderExpression: string = this.getDayOrderExpression();
    return await this.createQueryBuilder('bh')
      .where('bh.idBusiness = :idBusiness', { idBusiness })
      .orderBy(dayOrderExpression, 'ASC')
      .addOrderBy('bh.slotOrder', 'ASC')
      .addOrderBy('bh.opensAtMinute', 'ASC')
      .getMany();
  }

  /**
   * Builds SQL ordering expression for week day enum values.
   * @returns {string} SQL CASE expression.
   */
  private getDayOrderExpression(): string {
    return `CASE
      WHEN bh.dayOfWeek = '${WeekDayEnum.SUNDAY}' THEN 0
      WHEN bh.dayOfWeek = '${WeekDayEnum.MONDAY}' THEN 1
      WHEN bh.dayOfWeek = '${WeekDayEnum.TUESDAY}' THEN 2
      WHEN bh.dayOfWeek = '${WeekDayEnum.WEDNESDAY}' THEN 3
      WHEN bh.dayOfWeek = '${WeekDayEnum.THURSDAY}' THEN 4
      WHEN bh.dayOfWeek = '${WeekDayEnum.FRIDAY}' THEN 5
      WHEN bh.dayOfWeek = '${WeekDayEnum.SATURDAY}' THEN 6
      ELSE 7
    END`;
  }
}
