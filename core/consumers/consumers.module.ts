import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  CatalogsConsumer,
  QueuesManager,
  SearchDataConsumer,
} from '.';
import { QueueLogsConsumer } from './queue-logs.consumer';
import { FilesModule } from '../modules/files/files.module';
import { UsersModule } from '../modules/users/users.module';
import { BusinessesModule } from '../modules/businesses/businesses.module';
import { ProductsModule } from '../modules/products/products.module';
import { CatalogsModule } from '../modules/catalogs/catalogs.module';
import { SearchModule } from '../modules/search/search.module';

@Module({})
export class ConsumersModule {
  static register(): DynamicModule {
    const logger = new Logger('ConsumersModule');
    logger.log('Processing Bull jobs');
    return {
      module: ConsumersModule,
      imports: [
        BullModule.registerQueue({
          name: QueuesManager.queueNames.emailSender,
        }),
        TypeOrmModule.forFeature([]),
        FilesModule,
        UsersModule,
        BusinessesModule,
        ProductsModule,
        CatalogsModule,
        SearchModule,
        ...QueuesManager.queuesForImport(),
      ],
      providers: [
        CatalogsConsumer,
        QueueLogsConsumer,
        SearchDataConsumer,
      ],
    };
  }
}
