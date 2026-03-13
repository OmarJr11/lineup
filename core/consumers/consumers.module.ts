import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CatalogsConsumer,
  DiscountsConsumer,
  MailsConsumer,
  QueuesManager,
  ReviewsConsumer,
  SearchDataConsumer,
} from '.';
import { QueueLogsConsumer } from './queue-logs.consumer';
import { FilesModule } from '../modules/files/files.module';
import { ProductTagsModule } from '../modules/product-tags/product-tags.module';
import { UsersModule } from '../modules/users/users.module';
import { BusinessesModule } from '../modules/businesses/businesses.module';
import { ProductsModule } from '../modules/products/products.module';
import { CatalogsModule } from '../modules/catalogs/catalogs.module';
import { SearchModule } from '../modules/search/search.module';
import { MailModule } from '../modules/mail/mail.module';
import { ProductRatingsModule } from '../modules/product-ratings/product-ratings.module';
import { DiscountProductAuditsModule } from '../modules/discount-product-audits/discount-product-audits.module';
import { DiscountsModule } from '../modules/discounts/discounts.module';
import { GeminiModule } from '../modules/gemini/gemini.module';
import { TagsModule } from '../modules/tags/tags.module';

@Module({})
export class ConsumersModule {
  static register(): DynamicModule {
    const logger = new Logger('ConsumersModule');
    logger.log('Processing Bull jobs');
    return {
      module: ConsumersModule,
      imports: [
        BullModule.registerQueue({ name: QueuesManager.queueNames.mails }),
        TypeOrmModule.forFeature([]),
        FilesModule,
        ProductTagsModule,
        UsersModule,
        BusinessesModule,
        ProductsModule,
        CatalogsModule,
        SearchModule,
        MailModule,
        ProductRatingsModule,
        DiscountProductAuditsModule,
        DiscountsModule,
        GeminiModule,
        ...QueuesManager.queuesForImport(),
      ],
      providers: [
        CatalogsConsumer,
        DiscountsConsumer,
        MailsConsumer,
        QueueLogsConsumer,
        SearchDataConsumer,
        ReviewsConsumer,
      ],
    };
  }
}
