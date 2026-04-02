import { IsEnum, IsNotEmpty } from 'class-validator';
import { DirectoriesEnum } from '../../../../core/common/enums';

export class UploadFileDto {
  @IsNotEmpty()
  @IsEnum(DirectoriesEnum)
  directory: DirectoriesEnum;
}
