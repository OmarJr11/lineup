import { Inject, Injectable, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { BasicService } from '../../common/services';
import { Product } from '../../entities';
import { CatalogsService } from '../catalogs/catalogs.service';
import { Repository } from 'typeorm';
import { ProductsSettersService } from './products-setters.service';
import { ProductsGettersService } from './products-getters.service';
import { IBusinessReq } from '../../common/interfaces/business-req.interface';
import { InfinityScrollInput } from '../../common/dtos';
import { Transactional } from 'typeorm-transactional-cls-hooked';

@Injectable()
export class ProductsService extends BasicService<Product> {
    private logger = new Logger(CatalogsService.name);
    
    constructor(
      @Inject(REQUEST)
      private readonly businessRequest: Request,
      @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
      private readonly productsSettersService: ProductsSettersService,
      private readonly productsGettersService: ProductsGettersService
    ) {
      super(productRepository, businessRequest);
    }

    /**
     * Create a new product
     * @param {CreateProductInput} data - The product data
     * @param {IBusinessReq} businessReq - The business request
     */
    @Transactional()
    async create(
      data: CreateProductInput,
      businessReq: IBusinessReq
    ): Promise<Product> {
      const product = await this.productsSettersService.create(data, businessReq);
      return product;
    }

    /**
     * Get all Products with pagination
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<Product[]>}
     */
    async findAll(query: InfinityScrollInput): Promise<Product[]> {
      return await this.productsGettersService.findAll(query);
    }

    /**
     * Find a product by its ID.
     * @param {number} id - The ID of the product to find.
     * @returns {Promise<Product>} The found Product.
     */
    async findOne(id: number): Promise<Product> {
      return await this.productsGettersService.findOne(id);
    }

    
    /**
     * Update a product.
     * @param {UpdateProductInput} data - The data for updating the product.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<Product>} The updated product.
     */
    @Transactional()
    async update(
      data: UpdateProductInput,
      businessReq: IBusinessReq
    ): Promise<Product> {
      const product = await this.productsGettersService.findOne(data.id);
      await this.productsSettersService.update(product, data, businessReq);
      return await this.productsGettersService.findOne(product.id);
    }

    /**
     * Remove a product.
     * @param {number} id - The ID of the product to remove.
     * @param {IBusinessReq} businessReq - The business request object.
     * @return {Promise<boolean>} True if the product was removed successfully.
     */
    @Transactional()
    async remove(id: number, businessReq: IBusinessReq): Promise<boolean> {
      const product = await this.productsGettersService.findOne(id);
      await this.productsSettersService.remove(product, businessReq);
      return true;
    }
}
