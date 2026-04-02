import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchIndexService } from './search-index.service';
import { ProductSearchIndexGettersService } from './product-search-index-getters.service';
import { ProductSearchIndex } from '../../entities';
import { BusinessesModule } from '../businesses/businesses.module';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { ProductsModule } from '../products/products.module';
import { GeminiModule } from '../gemini/gemini.module';

/**
 * Search module for full-text search over businesses, catalogs, and products.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([ProductSearchIndex]),
    BusinessesModule,
    CatalogsModule,
    ProductsModule,
    GeminiModule,
  ],
  providers: [
    SearchService,
    SearchIndexService,
    ProductSearchIndexGettersService,
  ],
  exports: [
    SearchService,
    SearchIndexService,
    ProductSearchIndexGettersService,
  ],
})
export class SearchModule {}
