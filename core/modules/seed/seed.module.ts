import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { ProductsModule } from '../products/products.module';
import { SeedService } from './seed.service';

@Module({
    imports: [BusinessesModule, CatalogsModule, ProductsModule],
    providers: [SeedService],
    exports: [SeedService],
})
export class SeedModule {}
