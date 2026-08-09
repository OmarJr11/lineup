import {
  Injectable,
  InternalServerErrorException,
  Logger,
  Scope,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { File } from '../../entities';
import { BasicService } from '../../common/services';
import { filesResponses } from '../../common/responses';
import { LogError } from '../../common/helpers/logger.helper';

@Injectable({ scope: Scope.REQUEST })
export class FilesGettersService extends BasicService<File> {
  private logger: Logger = new Logger(FilesGettersService.name);
  private readonly rUpload = filesResponses.upload;

  constructor(
    @InjectRepository(File)
    private readonly filesRepository: Repository<File>,
  ) {
    super(filesRepository);
  }

  /**
   * Get images by names
   * @param {string[]} names - Array of image names to search for
   * @returns {Promise<File[]>} - Returns a promise that resolves to an array of File entities
   */
  async getImageByNames(names: string[]): Promise<File[]> {
    return await this.find({
      where: { name: In(names) },
    }).catch((error) => {
      LogError(this.logger, error as Error, this.getImageByNames.name);
      throw new InternalServerErrorException(this.rUpload.error);
    });
  }

  /**
   * Get image by name
   * @param {string} name - The name of the image to search for
   * @returns {Promise<File>} - Returns a promise that resolves to a File entity
   */
  async getImageByName(name: string): Promise<File> {
    try {
      return await this.findOneWithOptionsOrFail({ where: { name } });
    } catch (error) {
      LogError(this.logger, error as Error, this.getImageByName.name);
      throw new InternalServerErrorException(this.rUpload.error);
    }
  }
}
