import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { BasicService } from '../../common/services';
import { IUserOrBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { entityAuditsResponses } from '../../common/responses';
import { EntityAudit } from '../../entities';
import { RecordEntityAuditDto } from './dto';

/**
 * Write service responsible for persisting entity audit records.
 */
@Injectable()
export class EntityAuditsSettersService extends BasicService<EntityAudit> {
    private readonly logger = new Logger(EntityAuditsSettersService.name);
    private readonly rCreate = entityAuditsResponses.create;

    constructor(
        @InjectRepository(EntityAudit)
        private readonly entityAuditRepository: Repository<EntityAudit>,
    ) {
        super(entityAuditRepository);
    }

    /**
     * Record an audit entry for any entity change.
     * @param {RecordEntityAuditDto} input - The audit data.
     * @returns {Promise<EntityAudit>} The created audit record.
     */
    @Transactional()
    async record(
        input: RecordEntityAuditDto,
        userOrBusinessReq: IUserOrBusinessReq
    ): Promise<EntityAudit> {
        try {
            return await this.save(input, userOrBusinessReq);
        } catch (error) {
            LogError(this.logger, error, this.record.name, userOrBusinessReq);
            throw new InternalServerErrorException(this.rCreate.error);
        }
    }
}
