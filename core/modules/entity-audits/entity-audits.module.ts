import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityAudit } from '../../entities';
import { EntityAuditsService } from './entity-audits.service';
import { EntityAuditsGettersService } from './entity-audits-getters.service';
import { EntityAuditsSettersService } from './entity-audits-setters.service';

/**
 * Module for entity audits (generic audit history).
 */
@Module({
    imports: [TypeOrmModule.forFeature([EntityAudit])],
    providers: [
        EntityAuditsService,
        EntityAuditsGettersService,
        EntityAuditsSettersService,
    ],
    exports: [
        EntityAuditsService,
        EntityAuditsGettersService,
        EntityAuditsSettersService,
    ],
})
export class EntityAuditsModule {}
