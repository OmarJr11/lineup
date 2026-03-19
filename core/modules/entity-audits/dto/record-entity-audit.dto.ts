import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
} from 'class-validator';
import { AuditOperationEnum, AuditableEntityNameEnum } from '../../../common/enums';
import { EntityAuditValues } from '../../../common/types';
import { Field, Int } from '@nestjs/graphql';

/**
 * DTO for recording a generic entity audit.
 */
export class RecordEntityAuditDto {
    @Field(() => AuditableEntityNameEnum)
    @IsNotEmpty()
    @IsEnum(AuditableEntityNameEnum)
    entityName: AuditableEntityNameEnum;

    @Field(() => Int)
    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    entityId: number;

    @Field(() => AuditOperationEnum)
    @IsNotEmpty()
    @IsEnum(AuditOperationEnum)
    operation: AuditOperationEnum;

    @Field(() => JSON)
    @IsOptional()
    @IsObject()
    oldValues?: EntityAuditValues;

    @Field(() => JSON)
    @IsOptional()
    @IsObject()
    newValues?: EntityAuditValues;
}
