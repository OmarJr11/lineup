import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CreateProductInput } from '../../../../core/modules/products/dto/create-product.input';
import { ProductsService } from '../../../../core/modules/products/products.service';
import { UpdateProductInput } from '../../../../core/modules/products/dto/update-product.input';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { PaginatedProducts, ProductSchema } from '../../../../core/schemas';
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
import { productsResponses } from '../../../../core/common/responses';
import { ProductsPermissionsEnum } from '../../../../core/common/enums';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { toProductSchema } from '../../../../core/common/functions';
import { InfinityScrollInput } from '../../../../core/common/dtos';

@UsePipes(new ValidationPipe())
@Resolver(() => ProductSchema)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Create a product.
   * @param {CreateProductInput} data - The create data.
   * @param {IBusinessReq} businessReq - The business request.
   */
  @Mutation(() => ProductSchema, { name: 'createProduct' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(ProductsPermissionsEnum.PRODCRE)
  @Response(productsResponses.create)
  async create(
    @Args('data') data: CreateProductInput,
    @BusinessDec() businessReq: IBusinessReq,
  ) {
    const product = await this.productsService.create(data, businessReq);
    return toProductSchema(product);
  }

  /**
   * Get all products.
   * @param {InfinityScrollInput} pagination - The pagination input.
   */
  @Query(() => PaginatedProducts, { name: 'findAllProducts' })
  async findAll(
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ) {
    const items = (await this.productsService.findAll(pagination)).map(
      (product) => toProductSchema(product),
    );
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  /**
   * Get all primary products by business.
   * @param {number} idBusiness - The ID of the business.
   * @returns {Promise<ProductSchema[]>} Array of primary products.
   */
  @Query(() => [ProductSchema], { name: 'getAllPrimaryProductsByBusiness' })
  async getAllPrimaryProductsByBusiness(
    @Args('idBusiness', { type: () => Int }) idBusiness: number,
  ): Promise<ProductSchema[]> {
    const products = await this.productsService.findAllByBusinessAndIsPrimary(
      idBusiness,
      true,
    );
    return products.map((product) => toProductSchema(product));
  }

  /**
   * Get all products by catalog.
   * @param {number} idCatalog - The ID of the catalog.
   * @param {string} search - The search query.
   */
  @Query(() => [ProductSchema], { name: 'getAllByCatalog' })
  async getAllByCatalog(
    @Args('idCatalog', { type: () => Int }) idCatalog: number,
    @Args('search', { type: () => String, nullable: true }) search?: string,
  ) {
    const items = await this.productsService.findAllByCatalog(
      idCatalog,
      search,
    );
    return items.map((product) => toProductSchema(product));
  }

  /**
   * Get all products by catalog with pagination.
   * @param {number} idCatalog - The ID of the catalog.
   * @param {InfinityScrollInput} pagination - The pagination input.
   */
  @Query(() => PaginatedProducts, { name: 'getAllByCatalogPaginated' })
  async getAllByCatalogPaginated(
    @Args('idCatalog', { type: () => Int }) idCatalog: number,
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ) {
    const items = (
      await this.productsService.getAllByCatalogPaginated(idCatalog, pagination)
    ).map((product) => toProductSchema(product));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  /**
   * Get all products by business.
   * @param {number} idBusiness - The ID of the business.
   * @param {InfinityScrollInput} pagination - The pagination input.
   */
  @Query(() => PaginatedProducts, { name: 'getAllByBusiness' })
  async getAllByBusiness(
    @Args('idBusiness', { type: () => Int }) idBusiness: number,
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ) {
    const items = (
      await this.productsService.findAllByBusiness(idBusiness, pagination)
    ).map((product) => toProductSchema(product));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  /**
   * Get products filtered by tag name or slug.
   * @param {string} tagNameOrSlug - Tag name or slug (e.g. "pan" or "pan-artesanal").
   * @param {InfinityScrollInput} pagination - Pagination parameters.
   */
  @Query(() => PaginatedProducts, { name: 'getAllByTag' })
  async getAllByTag(
    @Args('tagNameOrSlug', { type: () => String }) tagNameOrSlug: string,
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
  ) {
    const items = (
      await this.productsService.findAllByTag(tagNameOrSlug, pagination)
    ).map((product) => toProductSchema(product));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit,
    };
  }

  /**
   * Get one product by ID.
   * @param {number} id - The ID of the product.
   */
  @Query(() => ProductSchema, { name: 'findOneProduct' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return toProductSchema(await this.productsService.findOne(id));
  }

  /**
   * Update a product.
   * @param {UpdateProductInput} data - The update data.
   * @param {IBusinessReq} businessReq - The business request.
   */
  @Mutation(() => ProductSchema, { name: 'updateProduct' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(ProductsPermissionsEnum.PRODUPD)
  @Response(productsResponses.update)
  async update(
    @Args('data') data: UpdateProductInput,
    @BusinessDec() businessReq: IBusinessReq,
  ) {
    return toProductSchema(
      await this.productsService.update(data, businessReq),
    );
  }

  /**
   * Toggle product primary flag.
   * @param {number} idProduct - The ID of the product.
   * @param {IBusinessReq} businessReq - The business request.
   * @returns {Promise<ProductSchema>} The updated product.
   */
  @Mutation(() => ProductSchema, { name: 'toggleProductIsPrimary' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(ProductsPermissionsEnum.PRODUPD)
  @Response(productsResponses.update)
  async toggleProductIsPrimary(
    @Args('idProduct', { type: () => Int }) idProduct: number,
    @BusinessDec() businessReq: IBusinessReq,
  ): Promise<ProductSchema> {
    return toProductSchema(
      await this.productsService.toggleIsPrimary(idProduct, businessReq),
    );
  }

  /**
   * Remove a product.
   * @param {number} id - The ID of the product.
   * @param {IBusinessReq} businessReq - The business request.
   */
  @Mutation(() => Boolean, { name: 'removeProduct' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(ProductsPermissionsEnum.PRODDEL)
  @Response(productsResponses.delete)
  async remove(
    @Args('id', { type: () => Int }) id: number,
    @BusinessDec() businessReq: IBusinessReq,
  ) {
    return await this.productsService.remove(id, businessReq);
  }
}
