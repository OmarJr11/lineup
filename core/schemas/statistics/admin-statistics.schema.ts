import { Field, Int, ObjectType } from '@nestjs/graphql';
import { TimeSeriesDataPointSchema } from './time-series-data-point.schema';

/**
 * Root ObjectType for admin statistics resolvers (Query fields only).
 */
@ObjectType({ description: 'Admin platform statistics' })
export class AdminStatisticsRootSchema {}

@ObjectType()
export class AdminStatusCountSchema {
    @Field({ description: 'Status value (e.g. active, inactive)' })
    status: string;

    @Field(() => Int)
    count: number;
}

@ObjectType()
export class AdminTimeSeriesStatsSchema {
    @Field(() => Int, { description: 'Total count in the period' })
    total: number;

    @Field(() => [TimeSeriesDataPointSchema], {
        nullable: true,
        description: 'Time-series points when granularity is set',
    })
    data?: TimeSeriesDataPointSchema[];
}

@ObjectType()
export class AdminUserStatsSchema {
    @Field(() => Int)
    totalUsers: number;

    @Field(() => [AdminStatusCountSchema])
    usersByStatus: AdminStatusCountSchema[];

    @Field(() => AdminTimeSeriesStatsSchema, {
        nullable: true,
        description: 'New user registrations when a date range is provided',
    })
    newUsersInPeriod?: AdminTimeSeriesStatsSchema;
}

@ObjectType()
export class AdminBusinessStatsSchema {
    @Field(() => Int)
    totalBusinesses: number;

    @Field(() => Int, { description: 'Businesses marked as online' })
    onlineBusinessesCount: number;

    @Field(() => [AdminStatusCountSchema])
    businessesByStatus: AdminStatusCountSchema[];

    @Field(() => AdminTimeSeriesStatsSchema, {
        nullable: true,
        description: 'New business registrations when a date range is provided',
    })
    newBusinessesInPeriod?: AdminTimeSeriesStatsSchema;
}

@ObjectType()
export class AdminPlatformEngagementStatsSchema {
    @Field(() => AdminTimeSeriesStatsSchema)
    businessVisits: AdminTimeSeriesStatsSchema;

    @Field(() => AdminTimeSeriesStatsSchema)
    productVisits: AdminTimeSeriesStatsSchema;

    @Field(() => AdminTimeSeriesStatsSchema)
    catalogVisits: AdminTimeSeriesStatsSchema;
}

@ObjectType()
export class AdminCatalogGlobalStatsSchema {
    @Field(() => Int)
    totalProducts: number;

    @Field(() => Int)
    totalSkus: number;

    @Field(() => Int, {
        description: 'Products with no stock or all SKU quantities unset',
    })
    productsWithoutStock: number;
}

@ObjectType()
export class AdminLabeledCountSchema {
    @Field()
    label: string;

    @Field(() => Int)
    count: number;
}

@ObjectType()
export class AdminDiscountGlobalStatsSchema {
    @Field(() => [AdminLabeledCountSchema])
    discountsByStatus: AdminLabeledCountSchema[];

    @Field(() => [AdminLabeledCountSchema])
    discountsByType: AdminLabeledCountSchema[];

    @Field(() => Int)
    expiringSoonCount: number;
}
