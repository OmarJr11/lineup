import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { DiscountScopeEnum } from '../../../common/enums';

/**
 * Input for finding discounts by scope.
 * Scope business: returns all discounts of the business.
 * Scope catalog: returns all catalog-scope discounts of the business.
 * Scope product: returns all product-scope discounts of the business.
 */
@InputType()
export class FindDiscountsByScopeInput {
  @Field(() => DiscountScopeEnum)
  @IsNotEmpty()
  @IsEnum(DiscountScopeEnum)
  scope: DiscountScopeEnum;
}
