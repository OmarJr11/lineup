import { Field, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { UpdateProductSkuItemInput } from './update-product-sku-item.input';

/**
 * Input for updating multiple SKUs. Each item specifies the SKU id and the fields to update.
 */
@InputType()
export class UpdateProductSkusInput {
  @Field(() => [UpdateProductSkuItemInput])
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductSkuItemInput)
  skus: UpdateProductSkuItemInput[];
}
