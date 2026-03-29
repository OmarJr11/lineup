import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { BusinessHoursService } from '../../../../core/modules/business-hours/business-hours.service';
import { BusinessHourSchema } from '../../../../core/schemas';
import {
  BusinessDec,
  Permissions,
  Response,
} from '../../../../core/common/decorators';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { businessHoursResponses } from '../../../../core/common/responses';
import {
  JwtAuthGuard,
  PermissionsGuard,
  TokenGuard,
} from '../../../../core/common/guards';
import { toBusinessHourSchema } from '../../../../core/common/functions';
import { CreateBusinessHoursInput } from '../../../../core/modules/business-hours/dto/create-business-hours.input';
import { UpdateBusinessHourInput } from '../../../../core/modules/business-hours/dto/update-business-hour.input';
import { BusinessesPermissionsEnum } from '../../../../core/common/enums';

/**
 * GraphQL resolver for business weekly opening slots.
 */
@UsePipes(new ValidationPipe())
@Resolver(() => BusinessHourSchema)
export class BusinessHoursResolver {
  constructor(private readonly businessHoursService: BusinessHoursService) {}

  /**
   * Creates multiple slots for the authenticated business.
   * @param {CreateBusinessHoursInput} data - Bulk slots payload.
   * @param {IBusinessReq} businessReq - Current business request.
   * @returns {Promise<BusinessHourSchema[]>} Updated ordered schedule.
   */
  @Mutation(() => [BusinessHourSchema], { name: 'createBusinessHours' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURUPDOWN)
  @Response(businessHoursResponses.create)
  async create(
    @Args('data') data: CreateBusinessHoursInput,
    @BusinessDec() businessReq: IBusinessReq,
  ): Promise<BusinessHourSchema[]> {
    const businessHours: BusinessHourSchema[] = (
      await this.businessHoursService.create(data, businessReq)
    ).map((businessHour) => toBusinessHourSchema(businessHour));
    return businessHours;
  }

  /**
   * Updates one slot of the authenticated business.
   * @param {UpdateBusinessHourInput} data - Update payload.
   * @param {IBusinessReq} businessReq - Current business request.
   * @returns {Promise<BusinessHourSchema>} Updated slot.
   */
  @Mutation(() => BusinessHourSchema, { name: 'updateBusinessHour' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURUPDOWN)
  @Response(businessHoursResponses.update)
  async update(
    @Args('data') data: UpdateBusinessHourInput,
    @BusinessDec() businessReq: IBusinessReq,
  ): Promise<BusinessHourSchema> {
    return toBusinessHourSchema(
      await this.businessHoursService.update(data, businessReq),
    );
  }

  /**
   * Deletes one slot of the authenticated business.
   * @param {number} id - Slot ID.
   * @param {IBusinessReq} businessReq - Current business request.
   * @returns {Promise<boolean>} True when deleted.
   */
  @Mutation(() => Boolean, { name: 'removeBusinessHour' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURDELOWN)
  @Response(businessHoursResponses.delete)
  async remove(
    @Args('id', { type: () => Int }) id: number,
    @BusinessDec() businessReq: IBusinessReq,
  ): Promise<boolean> {
    return await this.businessHoursService.remove(id, businessReq);
  }

  /**
   * Gets ordered schedule for the authenticated business.
   * @param {IBusinessReq} businessReq - Current business request.
   * @returns {Promise<BusinessHourSchema[]>} Ordered schedule.
   */
  @Query(() => [BusinessHourSchema], { name: 'findAllMyBusinessHours' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(BusinessesPermissionsEnum.BURLISOWN)
  @Response(businessHoursResponses.list)
  async findAllMyBusinessHours(
    @BusinessDec() businessReq: IBusinessReq,
  ): Promise<BusinessHourSchema[]> {
    const businessHours: BusinessHourSchema[] = (
      await this.businessHoursService.findAllMyBusinessHours(businessReq)
    ).map((businessHour) => toBusinessHourSchema(businessHour));
    return businessHours;
  }
}
