import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { CatalogsService } from '../../../../core/modules/catalogs/catalogs.service';
import { CreateCatalogInput } from '../../../../core/modules/catalogs/dto/create-catalog.input';
import { UpdateCatalogInput } from '../../../../core/modules/catalogs/dto/update-catalog.input';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { CatalogSchema, PaginatedCatalogs } from '../../../../core/schemas';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { Permissions, BusinessDec, Response } from '../../../../core/common/decorators';
import { toCatalogSchema } from '../../../../core/common/functions';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { catalogsResponses } from '../../../../core/common/responses';
import { InfinityScrollInput } from '../../../../core/common/dtos';
import { CatalogsPermissionsEnum } from '../../../../core/common/enums';


@UsePipes(new ValidationPipe())
@Resolver(() => CatalogSchema)
export class CatalogsResolver {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Mutation(() => CatalogSchema, { name: 'createCatalog' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(CatalogsPermissionsEnum.CATCREATE)
  @Response(catalogsResponses.create)
  async create(
    @Args('data') data: CreateCatalogInput,
    @BusinessDec() businessReq: IBusinessReq
  ) {
    const catalog = await this.catalogsService.create(data, businessReq);
    return toCatalogSchema(catalog);
  }

  @Query(() => PaginatedCatalogs, { name: 'findAllCatalogs' })
  async findAll(
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput
  ) {
    const items = (await this.catalogsService.findAll(pagination))
      .map(catalog => toCatalogSchema(catalog));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  @Query(() => PaginatedCatalogs, { name: 'findAllMyCatalogs' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  async findAllMyCatalogs(
    @Args('pagination', { type: () => InfinityScrollInput })
    pagination: InfinityScrollInput,
    @BusinessDec() businessReq: IBusinessReq
  ) {
    const items = (await this.catalogsService.findAllMyCatalogs(pagination, businessReq))
      .map(catalog => toCatalogSchema(catalog));
    return {
      items,
      total: items.length,
      page: pagination.page,
      limit: pagination.limit
    };
  }

  @Query(() => CatalogSchema, { name: 'findOneCatalog' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return toCatalogSchema(await this.catalogsService.findOne(id));
  }

  @Query(() => CatalogSchema, { name: 'findOneCatalogByPath' })
  async findOneByPath(@Args('path', { type: () => String }) path: string) {
    return toCatalogSchema(await this.catalogsService.findOneByPath(path));
  }

  @Mutation(() => CatalogSchema, { name: 'updateCatalog' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(CatalogsPermissionsEnum.CATUPDATE)
  @Response(catalogsResponses.update)
  async update(
    @Args('data') data: UpdateCatalogInput,
    @BusinessDec() businessReq: IBusinessReq
  ) {
    return toCatalogSchema(await this.catalogsService.update(data, businessReq));
  }

  @Mutation(() => CatalogSchema, { name: 'removeCatalog' })
  @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
  @Permissions(CatalogsPermissionsEnum.CATDELETE)
  @Response(catalogsResponses.delete)
  async remove(@Args('id') id: number, @BusinessDec() businessReq: IBusinessReq) {
    return toCatalogSchema(await this.catalogsService.remove(id, businessReq));
  }
}
