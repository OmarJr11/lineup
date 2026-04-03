import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { TimeSeriesDataPointSchema } from './time-series-data-point.schema';
import { FrequencyDataPointSchema } from './frequency-data-point.schema';

/**
 * Host ObjectType for statistics resolver (root Query fields only).
 */
@ObjectType({ description: 'Business dashboard statistics' })
export class StatisticsRootSchema {}

@ObjectType()
export class TimeSeriesStatsSchema {
  @Field(() => Int, { description: 'Total count in the period' })
  total: number;
}

@ObjectType()
export class VisitsByAuthTypeSchema {
  @Field(() => Int)
  anonymous: number;

  @Field(() => Int)
  identified: number;

  @Field(() => [TimeSeriesDataPointSchema], { nullable: true })
  data?: TimeSeriesDataPointSchema[];
}

/**
 * Combined business visits statistics: total visits and breakdown by auth type.
 */
@ObjectType()
export class BusinessVisitsStatsSchema {
  @Field(() => TimeSeriesStatsSchema, {
    description: 'Total visits and optional time-series data',
  })
  visits: TimeSeriesStatsSchema;

  @Field(() => VisitsByAuthTypeSchema, {
    description: 'Visits split by anonymous vs identified users',
  })
  visitsByAuthType: VisitsByAuthTypeSchema;
}

/**
 * Combined engagement stats: visits and new followers.
 */
@ObjectType()
export class EngagementStatsSchema {
  @Field(() => BusinessVisitsStatsSchema, {
    description: 'Business visits stats (total and by auth type)',
  })
  visits: BusinessVisitsStatsSchema;

  @Field(() => TimeSeriesStatsSchema, {
    description: 'New followers stats',
  })
  newFollowers: TimeSeriesStatsSchema;
}

@ObjectType()
export class ProductStatItemSchema {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field(() => Int)
  visits: number;
}

@ObjectType()
export class ProductRatingStatItemSchema {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field(() => Float)
  ratingAverage: number;
}

@ObjectType()
export class ProductLikesStatItemSchema {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field(() => Int)
  likes: number;
}

@ObjectType()
export class VisitToLikeRatioSchema {
  @Field(() => Int)
  totalVisits: number;

  @Field(() => Int)
  totalLikes: number;

  @Field(() => Float)
  ratio: number;
}

@ObjectType()
export class CatalogStatItemSchema {
  @Field(() => Int)
  id: number;

  @Field()
  title: string;

  @Field(() => Int)
  visits: number;
}

/**
 * Date range metadata for discount statistics (ISO 8601 bounds).
 */
@ObjectType()
export class DiscountStatsDateRangeSchema {
  @Field({ description: 'Range start (inclusive), ISO 8601' })
  startDate: string;

  @Field({ description: 'Range end (inclusive), ISO 8601' })
  endDate: string;
}

/**
 * Combined discount statistics.
 */
@ObjectType()
export class DiscountStatsSchema {
  @Field(() => [FrequencyDataPointSchema])
  byStatus: FrequencyDataPointSchema[];

  @Field(() => [FrequencyDataPointSchema])
  byType: FrequencyDataPointSchema[];

  @Field(() => TimeSeriesStatsSchema, {
    description:
      'Discounts expiring in the given period (end_date in range); optional buckets when granularity is set',
  })
  expiringSoon: TimeSeriesStatsSchema;
}

/**
 * Combined catalog statistics.
 */
@ObjectType()
export class CatalogStatsSchema {
  @Field(() => [CatalogStatItemSchema])
  topByVisits: CatalogStatItemSchema[];

  @Field(() => [FrequencyDataPointSchema])
  productsPerCatalog: FrequencyDataPointSchema[];

  @Field(() => TimeSeriesStatsSchema)
  catalogVisitsOverTime: TimeSeriesStatsSchema;
}

/**
 * Combined product statistics.
 */
@ObjectType()
export class ProductStatsSchema {
  @Field(() => [ProductStatItemSchema])
  topByVisits: ProductStatItemSchema[];

  @Field(() => [ProductRatingStatItemSchema])
  topByRating: ProductRatingStatItemSchema[];

  @Field(() => [ProductLikesStatItemSchema])
  topByLikes: ProductLikesStatItemSchema[];

  @Field(() => Int)
  withoutVisitsCount: number;

  @Field(() => Int)
  withoutRatingsCount: number;

  @Field(() => VisitToLikeRatioSchema)
  visitToLikeRatio: VisitToLikeRatioSchema;
}

@ObjectType()
export class StockMovementStatItemSchema {
  @Field(() => Int)
  id: number;

  @Field()
  type: string;

  @Field(() => Int)
  quantityDelta: number;

  @Field()
  creationDate: Date;

  @Field(() => Float, { nullable: true })
  price?: number;
}

/**
 * Combined inventory/stock statistics.
 */
@ObjectType()
export class InventoryStatsSchema {
  @Field(() => Int)
  skusLowOrOutOfStockCount: number;

  @Field(() => [StockMovementStatItemSchema])
  recentStockMovements: StockMovementStatItemSchema[];

  @Field(() => TimeSeriesStatsSchema)
  salesCount: TimeSeriesStatsSchema;

  @Field(() => Int)
  productsWithoutStockCount: number;
}
