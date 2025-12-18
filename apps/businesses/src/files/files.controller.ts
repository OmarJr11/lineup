import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Bind,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import { FilesService } from '../../../../core/modules/files/files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  JwtAuthGuard,
  TokenGuard
} from '../../../../core/common/guards';
import { filesResponses } from '../../../../core/common/responses';
import { UploadFileDto } from '../../../../core/modules/files/dto/upload-file.dto';
import {
  IFileInterface,
  IUserReq
} from '../../../../core/common/interfaces';
import { UserDec } from '../../../../core/common/decorators';

@UsePipes(new ValidationPipe())
@Controller('files')
export class FilesController {
  private readonly rUpload = filesResponses.upload

  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(
      FileInterceptor('file', {
          limits: {
              fieldSize: 15 * 1024 * 1024,
          },
      })
  )
  @Bind(UploadedFile())
  @UseGuards(JwtAuthGuard, TokenGuard)
  async uploadFile(
    file: IFileInterface,
    @Body() data: UploadFileDto,
    @UserDec() user: IUserReq
) {
    return {
      ...this.rUpload.success,
      file: await this.filesService.uploadFile(file, data, user),
    }
  }
}
