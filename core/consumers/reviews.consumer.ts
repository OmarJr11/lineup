import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { ReviewsConsumerEnum, QueueNamesEnum, SearchDataConsumerEnum } from '../common/enums/consumers';
import { LogWarn } from '../common/helpers';
import { ProductRatingsGettersService } from '../modules/product-ratings/product-ratings-getters.service';
import { ProductsSettersService } from '../modules/products/products-setters.service';
import { ProductsGettersService } from '../modules/products/products-getters.service';
import { IUserReq } from '../common/interfaces';

/** Payload for calculate average job. */
interface CalculateAverageJobData { idProduct: number; user: IUserReq }

/**
 * Consumer for product rating background jobs.
 * Calculates the average star rating and propagates it to the product
 * entity and the product search index.
 */
@Processor(QueueNamesEnum.reviews)
export class ReviewsConsumer extends WorkerHost {
    private readonly log = new Logger(ReviewsConsumer.name);

    constructor(
        private readonly productReviewsGettersService: ProductRatingsGettersService,
        private readonly productsGettersService: ProductsGettersService,
        private readonly productsSettersService: ProductsSettersService,
        @InjectQueue(QueueNamesEnum.searchData)
        private readonly searchDataQueue: Queue,
    ) {
        super();
    }

    /**
     * Process incoming jobs.
     * @param {Job} job - The job to process.
     */
    async process(job: Job): Promise<void> {
        switch (job.name) {
            case ReviewsConsumerEnum.CalculateAverage:
                await this.processCalculateAverage(job);
                break;
            default:
                LogWarn(this.log, `Unhandled job: ${job.name}`, this.process.name);
        }
    }

    /**
     * Calculates the average star rating for a product, persists it on the
     * product entity, and enqueues a job to sync the search index.
     * @param {Job<CalculateAverageJobData>} job - BullMQ job with { idProduct, user }.
     */
    private async processCalculateAverage(job: Job<CalculateAverageJobData>): Promise<void> {
        const { idProduct, user } = job.data;
        if (!idProduct) {
            LogWarn(this.log, `Missing idProduct in job ${job.id}`, this.processCalculateAverage.name);
            return;
        }
        const productReviews = await this.productReviewsGettersService.findAllByProduct(idProduct);
        const total = productReviews.length;
        const sum = productReviews.reduce((acc, pr) => acc + Number(pr.stars), 0);
        const ratingAverage = total > 0 ? sum / total : 0;
        const product = await this.productsGettersService.findOne(idProduct);
        await this.productsSettersService.updateRatingAverage(product, ratingAverage, user);
        await this.searchDataQueue.add(
            SearchDataConsumerEnum.SearchDataProductRatingRecord,
            { idProduct, ratingAverage },
        );
    }
}
