import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountProductAudit } from '../../entities';
import { DiscountProductAuditsService } from './discount-product-audits.service';
import { DiscountProductAuditsGettersService } from './discount-product-audits-getters.service';
import { DiscountProductAuditsSettersService } from './discount-product-audits-setters.service';

/**
 * Module for discount-product-audit (audit history) entity.
 */
@Module({
    imports: [TypeOrmModule.forFeature([DiscountProductAudit])],
    providers: [
        DiscountProductAuditsService,
        DiscountProductAuditsGettersService,
        DiscountProductAuditsSettersService,
    ],
    exports: [
        DiscountProductAuditsService,
        DiscountProductAuditsGettersService,
        DiscountProductAuditsSettersService,
    ],
})
export class DiscountProductAuditsModule {}
