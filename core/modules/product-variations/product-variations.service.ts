import { Inject, Injectable, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BasicService } from '../../common/services';
import { ProductVariation } from '../../entities';
import { Repository } from 'typeorm';

@Injectable()
export class ProductVariationsService extends BasicService<ProductVariation> {
    private logger = new Logger(ProductVariationsService.name);
    
    constructor(
      @Inject(REQUEST)
      private readonly businessRequest: Request,
      @InjectRepository(ProductVariation)
      private readonly productVariationRepository: Repository<ProductVariation>,
    ) {
      super(productVariationRepository, businessRequest);
    }
}
