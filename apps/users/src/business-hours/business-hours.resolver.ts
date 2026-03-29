import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { BusinessHoursService } from '../../../../core/modules/business-hours/business-hours.service';
import { BusinessHourSchema } from '../../../../core/schemas';
import { Response } from '../../../../core/common/decorators';
import { businessHoursResponses } from '../../../../core/common/responses';
import { toBusinessHourSchema } from '../../../../core/common/functions';

/**
 * GraphQL resolver for business weekly opening slots.
 */
@UsePipes(new ValidationPipe())
@Resolver(() => BusinessHourSchema)
export class BusinessHoursResolver {
  constructor(private readonly businessHoursService: BusinessHoursService) {}

  /**
   * Gets ordered schedule by business ID.
   * @param {number} idBusiness - Business ID.
   * @returns {Promise<BusinessHourSchema[]>} Ordered schedule.
   */
  @Query(() => [BusinessHourSchema], { name: 'findBusinessHoursByBusinessId' })
  @Response(businessHoursResponses.list)
  async findByBusiness(
    @Args('idBusiness', { type: () => Int }) idBusiness: number,
  ): Promise<BusinessHourSchema[]> {
    const businessHours: BusinessHourSchema[] = (
      await this.businessHoursService.findAllByBusiness(idBusiness)
    ).map((businessHour) => toBusinessHourSchema(businessHour));
    return businessHours;
  }
}
