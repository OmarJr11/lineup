import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CatalogsConsumerEnum, QueueNamesEnum } from '../common/enums/consumers';
import { CatalogsSettersService } from '../modules/catalogs/catalogs-setters.service';
import { LogWarn } from '../common/helpers';
import { ActionsEnum } from '../common/enums';
import { CatalogsGettersService } from '../modules/catalogs/catalogs-getters.service';
import { IBusinessReq } from '../common/interfaces';

/** Payload for update products count job. Increments or decrements catalogs.products_count. */
interface UpdateProductsCountJobData {
    idCatalog: number;
    action: ActionsEnum;
    businessReq: IBusinessReq;
}

/**
 * Consumer for catalog-related background jobs.
 */
@Processor(QueueNamesEnum.catalogs)
export class CatalogsConsumer extends WorkerHost {
    private readonly log = new Logger(CatalogsConsumer.name);

    constructor(
        private readonly catalogsSettersService: CatalogsSettersService,
        private readonly catalogsGettersService: CatalogsGettersService
    ) {
        super();
    }

    /**
     * Process incoming jobs.
     * @param {Job} job - The job to process.
     */
    async process(job: Job): Promise<void> {
        switch (job.name) {
            case CatalogsConsumerEnum.UpdateProductsCount:
                await this.processUpdateProductsCount(job);
                break;
            default:
                LogWarn(this.log, `Unhandled job: ${job.name}`, this.process.name);
        }
    }

    /**
     * Processes an update products count job. Increments or decrements catalogs.products_count.
     * @param {Job<UpdateProductsCountJobData>} job - BullMQ job with { idCatalog, action }.
     */
    private async processUpdateProductsCount(job: Job<UpdateProductsCountJobData>): Promise<void> {
        const { idCatalog, action, businessReq } = job.data;
        if (!idCatalog || !action) {
            LogWarn(this.log, `Missing idCatalog or action in job ${job.id}`, this.processUpdateProductsCount.name);
            return;
        }
        const catalog = await this.catalogsGettersService.findOne(idCatalog);
        await this.catalogsSettersService
            .updateProductsCount(catalog, action, businessReq);
    }
}
