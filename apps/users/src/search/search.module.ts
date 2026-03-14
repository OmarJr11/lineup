import { Module } from '@nestjs/common';
import { SearchResolver } from './search.resolver';
import { SearchModule as SearchModuleCore } from '../../../../core/modules/search/search.module';
import { UserSearchesModule } from '../../../../core/modules/user-searches/user-searches.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OptionalJwtAuthGuard } from '../../../../core/common/guards';

/**
 * Search module for the users app.
 * Exposes search query for businesses, catalogs, and products.
 * Works for both authenticated users and anonymous visitors.
 * Records search terms for logged-in users to build personalized collections.
 */
@Module({
    imports: [
        SearchModuleCore,
        UserSearchesModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
            }),
        }),
    ],
    providers: [SearchResolver, OptionalJwtAuthGuard],
})
export class SearchModule {}
