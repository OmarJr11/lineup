import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NotificationTypeEnum } from '../../../common/enums';
import type { INotificationPayload } from '../../../common/interfaces';
import { Type } from 'class-transformer';

/**
 * Parameters for creating a persisted notification (internal callers).
 */
export class CreateNotificationParams {
  @IsNotEmpty()
  @IsEnum(NotificationTypeEnum)
  type: NotificationTypeEnum;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  body: string;

  @IsOptional()
  @IsNotEmpty()
  @IsObject()
  payload?: INotificationPayload;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @IsInt()
  idUser?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @IsInt()
  idBusiness?: number;
}
