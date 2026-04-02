import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { CreateBusinessHourItemInput } from './create-business-hour-item.input';

/**
 * Input to create multiple business opening slots in one request.
 */
@InputType()
export class CreateBusinessHoursInput {
  @Field(() => [CreateBusinessHourItemInput])
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBusinessHourItemInput)
  slots: CreateBusinessHourItemInput[];
}
