import { IsNotEmpty, ValidateNested } from 'class-validator';
import { RegisterSaleInput } from './register-sale.input';
import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';

@InputType()
export class SalesInput {
  @Field(() => [RegisterSaleInput])
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => RegisterSaleInput)
  sales: RegisterSaleInput[];
}
