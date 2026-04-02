import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProductCollectionsService } from '../../../../core/modules/product-collections/product-collections.service';
import { OptionalJwtAuthGuard } from '../../../../core/common/guards';
import { UserDec } from '../../../../core/common/decorators';
import { ProductCollectionSchema } from '../../../../core/schemas';
import { toProductSchema } from '../../../../core/common/functions';
import type { IUserReq } from '../../../../core/common/interfaces';

/**
 * Resolver for dynamic product collections (personalized recommendations).
 * Returns collections based on visited products, likes, location, and search history.
 * When the user has no data, returns fallback collections (top rated, most visited).
 */
@UsePipes(new ValidationPipe())
@Resolver(() => ProductCollectionSchema)
export class CollectionsResolver {
  constructor(
    private readonly productCollectionsService: ProductCollectionsService,
  ) {}

  /**
   * Gets product collections for the current user.
   * For authenticated users: collections based on visits, likes, location, searches.
   * For anonymous users: fallback collections (top rated, most visited).
   * @param {IUserReq | null} user - The authenticated user, or null for anonymous.
   * @returns {Promise<ProductCollectionSchema[]>} Array of product collections.
   */
  @UseGuards(OptionalJwtAuthGuard)
  @Query(() => [ProductCollectionSchema], { name: 'productCollections' })
  async getProductCollections(
    @UserDec() user?: IUserReq | null,
  ): Promise<ProductCollectionSchema[]> {
    const idUser = user?.userId ?? null;
    const collections =
      await this.productCollectionsService.getCollections(idUser);
    return collections.map((c) => ({
      id: c.id,
      title: c.title,
      products: c.products.map((p) => toProductSchema(p)),
    }));
  }
}
