import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { EntityAudit } from '../../entities';
import { QueueNamesEnum } from '../../common/enums';
import { EntityAuditsService } from './entity-audits.service';
import { EntityAuditsGettersService } from './entity-audits-getters.service';
import { EntityAuditsSettersService } from './entity-audits-setters.service';
import { EntityAuditsQueueService } from './entity-audits-queue.service';

/**
 * Module for entity audits (generic audit history).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([EntityAudit]),
    BullModule.registerQueue({ name: QueueNamesEnum.entityAudits }),
  ],
  providers: [
    EntityAuditsService,
    EntityAuditsGettersService,
    EntityAuditsSettersService,
    EntityAuditsQueueService,
  ],
  exports: [
    EntityAuditsService,
    EntityAuditsGettersService,
    EntityAuditsSettersService,
    EntityAuditsQueueService,
  ],
})
export class EntityAuditsModule {}
