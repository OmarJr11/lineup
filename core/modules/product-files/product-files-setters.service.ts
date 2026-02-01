import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateProductFileInput } from './dto/create-product-file.input';
import { UpdateProductFileInput } from './dto/update-product-file.input';
import { ProductFile } from '../../entities';
import { BasicService } from '../../common/services';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBusinessReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { productFilesResponses } from '../../common/responses';
import { Transactional } from 'typeorm-transactional-cls-hooked';

@Injectable()
export class ProductFilesSettersService extends BasicService<ProductFile> {
    private logger = new Logger(ProductFilesSettersService.name);
    private readonly rCreate = productFilesResponses.create;
    private readonly rUpdate = productFilesResponses.update;
    private readonly rDelete = productFilesResponses.delete;

    constructor(
      @InjectRepository(ProductFile)
      private readonly productFileRepository: Repository<ProductFile>,
    ) {
      super(productFileRepository);
    }

    /**
     * Create a new product file.
     * @param {CreateProductFileInput} data - The data for the new product file.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<ProductFile>} The created product file.
     */
    @Transactional()
    async create(
        data: CreateProductFileInput,
        businessReq: IBusinessReq
    ): Promise<ProductFile> {
      try {
        return await this.save(data, businessReq);
      } catch (error) {
        LogError(this.logger, error, this.create.name, businessReq);
        throw new InternalServerErrorException(this.rCreate.error);
      }
    }

    /**
     * Update a product file.
     * @param {ProductFile} productFile - The product file to update.
     * @param {UpdateProductFileInput} data - The data for updating the product file.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    @Transactional()
    async update(
        productFile: ProductFile,
        data: UpdateProductFileInput,
        businessReq: IBusinessReq
    ) {
      try {
        return await this.updateEntity(data, productFile, businessReq);
      } catch (error) {
        LogError(this.logger, error, this.update.name, businessReq);
        throw new InternalServerErrorException(this.rUpdate.error);
      }
    }

    /**
     * Remove a product file or an array of product files.
     * @param {ProductFile | ProductFile[]} productFile - The product file to remove.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    @Transactional()
    async remove(productFile: ProductFile | ProductFile[], businessReq: IBusinessReq) {
      try {
        return await this.deleteEntityByStatus(productFile, businessReq);
      } catch (error) {
        LogError(this.logger, error, this.remove.name, businessReq);
        throw new InternalServerErrorException(this.rDelete.error);
      }
    }
}
