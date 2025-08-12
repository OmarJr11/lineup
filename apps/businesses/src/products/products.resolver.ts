import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CreateProductInput } from '../../../../core/modules/products/dto/create-product.input';
import { ProductsService } from '../../../../core/modules/products/products.service';
import { UpdateProductInput } from '../../../../core/modules/products/dto/update-product.input';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaginatedProducts, ProductSchema } from '../../../../core/schemas';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { Permissions, BusinessDec, Response } from '../../../../core/common/decorators';
import { productsResponses } from '../../../../core/common/responses';
import { ProductsPermissionsEnum } from '../../../../core/common/enums';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { toProductSchema } from '../../../../core/common/functions';
import { InfinityScrollInput } from '../../../../core/common/dtos';

@UsePipes(new ValidationPipe())
@Resolver(() => ProductSchema)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

    @Mutation(() => ProductSchema, { name: 'createProduct' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(ProductsPermissionsEnum.PRODCRE)
    @Response(productsResponses.create)
    async create(
      @Args('data') data: CreateProductInput,
      @BusinessDec() businessReq: IBusinessReq
    ) {
      const product = await this.productsService.create(data, businessReq);
      return toProductSchema(product);
    }

    @Query(() => PaginatedProducts, { name: 'findAllProducts' })
    async findAll(
      @Args('pagination', { type: () => InfinityScrollInput })
      pagination: InfinityScrollInput
    ) {
      const items = (await this.productsService.findAll(pagination))
        .map(product => toProductSchema(product));
      return {
        items,
        total: items.length,
        page: pagination.page,
        limit: pagination.limit
      };
    }

    @Query(() => ProductSchema, { name: 'findOneProduct' })
    findOne(@Args('id') id: number) {
      return this.productsService.findOne(id);
    }

    @Mutation(() => ProductSchema, { name: 'updateProduct' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(ProductsPermissionsEnum.PRODUPD)
    @Response(productsResponses.update)
    async update(
      @Args('data') data: UpdateProductInput,
      @BusinessDec() businessReq: IBusinessReq
    ) {
      return toProductSchema(await this.productsService.update(data, businessReq));
    }

    @Mutation(() => ProductSchema, { name: 'removeProduct' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(ProductsPermissionsEnum.PRODDEL)
    @Response(productsResponses.delete)
    async remove(@Args('id') id: number, @BusinessDec() businessReq: IBusinessReq) {
      return await this.productsService.remove(id, businessReq);
    }
}
