import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ProductSkuSchema,
  StockMovementSchema,
} from '../../../../core/schemas';
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
import { inventoryResponses } from '../../../../core/common/responses';
import { InventoryPermissionsEnum } from '../../../../core/common/enums';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { ProductSkusService } from '../../../../core/modules/product-skus/product-skus.service';
import { StockMovementsService } from '../../../../core/modules/stock-movements/stock-movements.service';
import { ProductsGettersService } from '../../../../core/modules/products/products-getters.service';
import {
  toProductSkuSchemaFromInventory,
  toStockMovementSchema,
} from '../../../../core/common/functions';
import { AdjustStockInput } from '../../../../core/modules/product-skus/dto/adjust-stock.input';
import { RegisterPurchaseInput } from '../../../../core/modules/product-skus/dto/register-purchase.input';

/**
 * Resolver for premium inventory management.
 * Requires INVMGMT permission (assigned to premium businesses).
 */
@UsePipes(new ValidationPipe())
@Resolver()
export class InventoryResolver {
  constructor(
    private readonly productSkusService: ProductSkusService,
    private readonly stockMovementsService: StockMovementsService,
    private readonly productsGettersService: ProductsGettersService,
  ) {}

  @Mutation(() => ProductSkuSchema, { name: 'adjustStock' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(InventoryPermissionsEnum.INVMGMT)
  @Response(inventoryResponses.adjustStock)
  async adjustStock(
    @Args('data') data: AdjustStockInput,
    @BusinessDec() businessReq: IBusinessReq,
  ) {
    const sku = await this.productSkusService.adjustStock(data, businessReq);
    return toProductSkuSchemaFromInventory(sku);
  }

  @Mutation(() => ProductSkuSchema, { name: 'registerPurchase' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(InventoryPermissionsEnum.INVMGMT)
  @Response(inventoryResponses.registerPurchase)
  async registerPurchase(
    @Args('data') data: RegisterPurchaseInput,
    @BusinessDec() businessReq: IBusinessReq,
  ) {
    const sku = await this.productSkusService.registerPurchase(
      data,
      businessReq,
    );
    return toProductSkuSchemaFromInventory(sku);
  }

  @Mutation(() => Boolean, { name: 'removeProductSku' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(InventoryPermissionsEnum.INVMGMT)
  @Response(inventoryResponses.removeSku)
  async removeProductSku(
    @Args('idProductSku', { type: () => Int }) idProductSku: number,
    @BusinessDec() businessReq: IBusinessReq,
  ) {
    await this.productSkusService.removeProductSku(idProductSku, businessReq);
    return true;
  }

  @Query(() => [ProductSkuSchema], { name: 'getStockByProduct' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(InventoryPermissionsEnum.INVMGMT)
  @Response(inventoryResponses.getStockHistory)
  async getStockByProduct(
    @Args('idProduct', { type: () => Int }) idProduct: number,
    @BusinessDec() businessReq: IBusinessReq,
  ) {
    const idBusiness = businessReq.businessId;
    await this.productsGettersService.findOneByBusinessId(
      idProduct,
      idBusiness,
    );
    const skus = await this.productSkusService.findAllByProductAndBusiness(
      idProduct,
      idBusiness,
    );
    return skus.map(toProductSkuSchemaFromInventory);
  }

  @Query(() => [StockMovementSchema], { name: 'getStockHistory' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(InventoryPermissionsEnum.INVMGMT)
  @Response(inventoryResponses.getStockHistory)
  async getStockHistory(
    @Args('idProductSku', { type: () => Int, nullable: true })
    idProductSku: number | null,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 50 })
    limit: number,
    @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 })
    offset: number,
    @BusinessDec() businessReq: IBusinessReq,
  ) {
    if (idProductSku != null) {
      await this.productSkusService.findOneByBusinessId(
        idProductSku,
        businessReq.businessId,
      );
      const movements = await this.stockMovementsService.findAllByProductSku(
        idProductSku,
        limit,
      );
      return movements.map(toStockMovementSchema);
    }
    const movements = await this.stockMovementsService.findAllByBusiness(
      businessReq.businessId,
      limit,
      offset,
    );
    return movements.map(toStockMovementSchema);
  }
}
