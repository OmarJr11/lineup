import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { WeekDayEnum } from '../../../common/enums/week-day.enum';

/**
 * Input to update one business opening slot.
 */
@InputType()
export class UpdateBusinessHourInput {
  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  id: number;

  @Field(() => WeekDayEnum, { nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(WeekDayEnum)
  dayOfWeek?: WeekDayEnum;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1439)
  opensAtMinute?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1440)
  closesAtMinute?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  slotOrder?: number;
}
