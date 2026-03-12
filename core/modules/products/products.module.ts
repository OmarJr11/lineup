import { Module, forwardRef } from '@nestjs/common';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../entities';
import { ProductsGettersService } from './products-getters.service';
import { ProductsSettersService } from './products-setters.service';
import { ProductFilesModule } from '../product-files/product-files.module';
import { ProductVariationsModule } from '../product-variations/product-variations.module';
import { ProductSkusModule } from '../product-skus/product-skus.module';
import { TagsModule } from '../tags/tags.module';
import { BullModule } from '@nestjs/bullmq';
import { QueueNamesEnum } from '../../common/enums';
import { CatalogsModule } from '../catalogs/catalogs.module';
import { FilesModule } from '../files/files.module';
import { ProductTagsModule } from '../product-tags/product-tags.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    TagsModule,
    forwardRef(() => ProductTagsModule),
    ProductFilesModule,
    ProductVariationsModule,
    ProductSkusModule,
    BullModule.registerQueue(
      {
        name: QueueNamesEnum.catalogs,
        defaultJobOptions: { removeOnComplete: true },
      },
      {
        name: QueueNamesEnum.searchData,
        defaultJobOptions: { removeOnComplete: true },
      },
      {
        name: QueueNamesEnum.products,
        defaultJobOptions: { removeOnComplete: true },
      }
    ),
    CatalogsModule,
    FilesModule,
  ],
  providers: [
    ProductsService,
    ProductsGettersService,
    ProductsSettersService
  ],
  exports: [
    ProductsService,
    ProductsGettersService,
    ProductsSettersService
  ]
})
export class ProductsModule {}
