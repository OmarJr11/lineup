import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VisitsService } from './visits.service';
import { BusinessVisitsModule } from '../business-visits/business-visits.module';
import { ProductVisitsModule } from '../product-visits/product-visits.module';
import { CatalogVisitsModule } from '../catalog-visits/catalog-visits.module';
import { QueueNamesEnum } from '../../common/enums';

@Module({
    imports: [
        BusinessVisitsModule,
        ProductVisitsModule,
        CatalogVisitsModule,
        BullModule.registerQueue({
            name: QueueNamesEnum.searchData,
            defaultJobOptions: { removeOnComplete: true },
        }),
    ],
    providers: [VisitsService],
    exports: [VisitsService]
})
export class VisitsModule {}
