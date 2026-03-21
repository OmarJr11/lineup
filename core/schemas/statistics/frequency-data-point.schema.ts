import { ObjectType, Field, Int } from '@nestjs/graphql';

/**
 * Single data point for frequency/category charts (histograms, bar charts).
 */
@ObjectType()
export class FrequencyDataPointSchema {
    @Field({ description: 'Category label' })
    label: string;

    @Field(() => Int, { description: 'Count for the category' })
    count: number;
}
