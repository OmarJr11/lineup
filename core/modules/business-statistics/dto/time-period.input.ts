import { InputType, Field } from '@nestjs/graphql';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { TimePeriodGranularityEnum } from '../../../common/enums/time-period-granularity.enum';

/**
 * Input for filtering statistics by time period.
 * When startDate and endDate are omitted, returns total (all-time) statistics.
 * When provided, filters and optionally groups by granularity for time-series charts.
 */
@InputType()
export class TimePeriodInput {
    /**
     * Start of the period (ISO 8601 date string).
     * Omit for all-time totals.
     */
    @Field({
        nullable: true,
        description: 'Start of the period (ISO 8601). Omit for all-time.'
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    /**
     * End of the period (ISO 8601 date string).
     * Omit for all-time totals.
     */
    @Field({ 
        nullable: true,
        description: 'End of the period (ISO 8601). Omit for all-time.'
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    /**
     * Granularity for time-series grouping (day/week/month).
     * Used when building data for line charts.
     * Ignored when startDate/endDate are omitted.
     */
    @Field(() => TimePeriodGranularityEnum, {
        nullable: true,
        description: 'Grouping for time-series. Ignored for all-time.',
    })
    @IsOptional()
    @IsEnum(TimePeriodGranularityEnum)
    granularity?: TimePeriodGranularityEnum;
}
