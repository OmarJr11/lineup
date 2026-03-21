import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ProductSkusService } from '../../../../core/modules/product-skus/product-skus.service';
import { UpdateProductSkusInput } from '../../../../core/modules/product-skus/dto/update-product-skus.input';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductSkuSchema } from '../../../../core/schemas';
import {
  JwtAuthGuard,
  PermissionsGuard,
  TokenGuard,
} from '../../../../core/common/guards';
import {
  Permissions,
  BusinessDec,
  Response,
} from '../../../../core/common/decorators';
import { productSkusResponses } from '../../../../core/common/responses';
import { ProductsPermissionsEnum } from '../../../../core/common/enums';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { toProductSkuSchema } from '../../../../core/common/functions';

@UsePipes(new ValidationPipe())
@Resolver(() => ProductSkuSchema)
export class ProductSkusResolver {
  constructor(private readonly productSkusService: ProductSkusService) {}

  /**
   * Get all SKUs for a product. Validates that the product belongs to the business.
   * @param {number} idProduct - The product ID.
   * @param {IBusinessReq} businessReq - The business request.
   */
  @Query(() => [ProductSkuSchema], { name: 'getSkusByProduct' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(ProductsPermissionsEnum.PRODUPD)
  async getSkusByProduct(
    @Args('idProduct', { type: () => Int }) idProduct: number,
    @BusinessDec() businessReq: IBusinessReq,
  ) {
    const skus = await this.productSkusService.findAllByProductAndBusiness(
      idProduct,
      businessReq.businessId,
    );
    return skus.map((sku) => toProductSkuSchema(sku));
  }

  /**
   * Update all SKUs of a product (price, currency, quantity).
   * Applies the same values to every SKU.
   * @param {UpdateProductSkusInput} data - The update data.
   * @param {IBusinessReq} businessReq - The business request.
   */
  @Mutation(() => [ProductSkuSchema], { name: 'updateProductSkus' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(ProductsPermissionsEnum.PRODUPD)
  @Response(productSkusResponses.update)
  async updateProductSkus(
    @Args('data') data: UpdateProductSkusInput,
    @BusinessDec() businessReq: IBusinessReq,
  ) {
    const skus = await this.productSkusService.updateAllSkusByProduct(
      data,
      businessReq,
    );
    return skus.map((sku) => toProductSkuSchema(sku));
  }
}
