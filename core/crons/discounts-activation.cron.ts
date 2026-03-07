import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DiscountsConsumerEnum, QueueNamesEnum } from '../common/enums/consumers';
import { DiscountsGettersService } from '../modules/discounts/discounts-getters.service';

/**
 * Cron job that activates PENDING discounts whose startDate has been reached.
 * Runs daily at midnight (00:00). Enqueues jobs to the discounts queue.
 */
@Injectable()
export class DiscountsActivationCronService {
    private readonly logger = new Logger(DiscountsActivationCronService.name);

    constructor(
        private readonly discountsGettersService: DiscountsGettersService,
        @InjectQueue(QueueNamesEnum.discounts)
        private readonly discountsQueue: Queue,
    ) {}

    /**
     * Finds PENDING discounts with startDate <= now and enqueues ActivateDiscount jobs.
     * Executes every day at midnight.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'America/Caracas' })
    async activatePendingDiscounts(): Promise<void> {
        const pendingDiscounts = await this.discountsGettersService
            .findAllPendingWithStartDateReached();
        if (pendingDiscounts.length > 0) {
            const ids = pendingDiscounts.map(discount => discount.id);
            await this.discountsQueue.add(DiscountsConsumerEnum.ActivateDiscount, { ids });
        }
    }
}
