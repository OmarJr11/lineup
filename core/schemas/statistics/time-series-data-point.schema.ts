import { ObjectType, Field, Int } from '@nestjs/graphql';

/**
 * Single data point for time-series charts (line charts, frequency polygons).
 */
@ObjectType()
export class TimeSeriesDataPointSchema {
  @Field({
    description: 'Period label (e.g. "2025-03-18", "2025-W12", "2025-03")',
  })
  period: string;

  @Field(() => Int, { description: 'Value for the period' })
  value: number;
}
