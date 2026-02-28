import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchIndexService } from './search-index.service';
import { BusinessesModule } from '../businesses/businesses.module';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { ProductsModule } from '../products/products.module';
import { GeminiModule } from '../gemini/gemini.module';

/**
 * Search module for full-text search over businesses, catalogs, and products.
 */
@Module({
    imports: [BusinessesModule, CatalogsModule, ProductsModule, GeminiModule],
    providers: [SearchService, SearchIndexService],
    exports: [SearchService, SearchIndexService],
})
export class SearchModule {}
