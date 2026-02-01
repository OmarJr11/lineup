import { Inject, Injectable, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BasicService } from '../../common/services';
import { ProductFile } from '../../entities';
import { Repository } from 'typeorm';

@Injectable()
export class ProductFilesService extends BasicService<ProductFile> {
    private logger = new Logger(ProductFilesService.name);

    constructor(
      @Inject(REQUEST)
      private readonly businessRequest: Request,
      @InjectRepository(ProductFile)
      private readonly productFileRepository: Repository<ProductFile>,
    ) {
      super(productFileRepository, businessRequest);
    }
}
