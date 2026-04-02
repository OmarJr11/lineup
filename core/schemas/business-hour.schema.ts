import { Field, Int, ObjectType } from '@nestjs/graphql';
import { WeekDayEnum } from '../common/enums/week-day.enum';
import { BusinessSchema } from './business.schema';

/**
 * GraphQL schema for weekly business opening slots.
 */
@ObjectType()
export class BusinessHourSchema {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  idBusiness: number;

  @Field(() => BusinessSchema, { nullable: true })
  business?: BusinessSchema;

  @Field(() => WeekDayEnum)
  dayOfWeek: WeekDayEnum;

  @Field(() => Int)
  opensAtMinute: number;

  @Field(() => Int)
  closesAtMinute: number;

  @Field(() => Int)
  slotOrder: number;
}
