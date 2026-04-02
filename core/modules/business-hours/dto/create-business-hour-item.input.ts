import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, Max, Min } from 'class-validator';
import { WeekDayEnum } from '../../../common/enums/week-day.enum';

/**
 * Input item to create one business opening slot.
 */
@InputType()
export class CreateBusinessHourItemInput {
  @Field(() => WeekDayEnum)
  @IsNotEmpty()
  @IsEnum(WeekDayEnum)
  dayOfWeek: WeekDayEnum;

  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1439)
  opensAtMinute: number;

  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1440)
  closesAtMinute: number;

  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  slotOrder: number;
}
