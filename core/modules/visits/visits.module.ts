import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { BusinessVisitsModule } from '../business-visits/business-visits.module';
import { ProductVisitsModule } from '../product-visits/product-visits.module';
import { CatalogVisitsModule } from '../catalog-visits/catalog-visits.module';

@Module({
    imports: [
        BusinessVisitsModule,
        ProductVisitsModule,
        CatalogVisitsModule
    ],
    providers: [VisitsService],
    exports: [VisitsService]
})
export class VisitsModule {}
