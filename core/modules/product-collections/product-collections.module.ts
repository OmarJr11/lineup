import { Module } from '@nestjs/common';
import { ProductCollectionsService } from './product-collections.service';
import { SearchModule } from '../search/search.module';
import { UserSearchesModule } from '../user-searches/user-searches.module';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { ProductVisitsModule } from '../product-visits/product-visits.module';
import { ProductReactionsModule } from '../product-reactions/product-reactions.module';

/**
 * Module for dynamic product collections (personalized recommendations).
 */
@Module({
    imports: [
        SearchModule,
        UserSearchesModule,
        UsersModule,
        ProductsModule,
        ProductVisitsModule,
        ProductReactionsModule,
    ],
    providers: [ProductCollectionsService],
    exports: [ProductCollectionsService],
})
export class ProductCollectionsModule {}
