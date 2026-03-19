import { Type } from 'class-transformer';
import {
    IsDefined,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';
import { AuditOperationEnum } from '../../../common/enums';
import { IUserOrBusinessReq } from '../../../common/interfaces';
import { EntityAuditValues } from '../../../common/types';
import { Field, Int } from '@nestjs/graphql';

/**
 * DTO for recording a generic entity audit.
 */
export class RecordEntityAuditDto {
    @Field(() => String)
    @IsNotEmpty()
    @IsString()
    @MaxLength(100)
    entityName: string;

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
