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
import { ProductFilesSettersService } from '../product-files/product-files-setters.service';
import { IBusinessReq } from '../../common/interfaces/business-req.interface';
import { InfinityScrollInput } from '../../common/dtos';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { ProductImageInput } from './dto/product-image.input';
import { ProductFilesGettersService } from '../product-files/product-files-getters.service';
import { ProductVariationsSettersService } from '../product-variations/product-variations-setters.service';
import { ProductVariationsGettersService } from '../product-variations/product-variations-getters.service';
import { ProductVariationInput } from './dto/product-variation.input';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ActionsEnum, CatalogsConsumerEnum, QueueNamesEnum, SearchDataConsumerEnum } from '../../common/enums';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';

@Injectable()
export class ProductsService extends BasicService<Product> {
    private logger = new Logger(CatalogsService.name);
    
    constructor(
      @Inject(REQUEST)
      private readonly businessRequest: Request,
      @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
      private readonly productsSettersService: ProductsSettersService,
      private readonly productsGettersService: ProductsGettersService,
      private readonly productFilesSettersService: ProductFilesSettersService,
      private readonly productFilesGettersService: ProductFilesGettersService,
      private readonly productVariationsSettersService: ProductVariationsSettersService,
      private readonly productVariationsGettersService: ProductVariationsGettersService,
      private readonly catalogsGettersService: CatalogsGettersService,
      @InjectQueue(QueueNamesEnum.catalogs)
      private readonly catalogsQueue: Queue,
      @InjectQueue(QueueNamesEnum.searchData)
      private readonly searchDataQueue: Queue,
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
      const idCatalog = data.idCatalog;
      const idBusiness = businessReq.businessId;
      await this.catalogsGettersService.checkIfExistsByIdAndBusinessId(idCatalog, idBusiness);
      const { images, variations } = this.extractProductRelations(data);
      const product = await this.productsSettersService.create(data, businessReq);
      if (images && images.length > 0) await this
        .createProductImages(product.id, images, businessReq);
      if (variations && variations.length > 0) await this
        .createProductVariations(product.id, variations, businessReq);
      await this.enqueueProductCreationJobs(
        product.id,
        idCatalog,
        ActionsEnum.Increment,
        businessReq
      );
      return await this.productsGettersService.findOneWithRelations(product.id);
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
     * Get all Products by Catalog with pagination
     * @param {number} idCatalog - The ID of the catalog
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<Product[]>}
     */
    async findAllByCatalog(
      idCatalog: number,
      query: InfinityScrollInput
    ): Promise<Product[]> {
      return await this.productsGettersService
        .findAllByCatalog(idCatalog, query);
    }

    /**
     * Get all Products by Business with pagination
     * @param {number} idBusiness - The ID of the business
     * @param {InfinityScrollInput} query - query parameters for pagination
     * @returns {Promise<Product[]>}
     */
    async findAllByBusiness(
      idBusiness: number,
      query: InfinityScrollInput
    ): Promise<Product[]> {
      return await this.productsGettersService
        .findAllByBusiness(idBusiness, query);
    }

    /**
     * Find a product by its ID.
     * @param {number} id - The ID of the product to find.
     * @returns {Promise<Product>} The found Product.
     */
    async findOne(id: number): Promise<Product> {
      return await this.productsGettersService.findOneWithRelations(id);
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
      const idBusiness = businessReq.businessId;
      const product = await this.productsGettersService.findOneByBusinessId(data.id, idBusiness);
      const idCatalog = data.idCatalog || product.idCatalog;
      await this.catalogsGettersService.checkIfExistsByIdAndBusinessId(idCatalog, idBusiness);
      const { images, variations } = this.extractProductRelations(data);
      await this.productsSettersService.update(product, data, businessReq);
      if (images && images.length > 0) await this.updateProductImages(product.id, images, businessReq);
      if (variations && variations.length > 0) await this.updateProductVariations(product.id, variations, businessReq);
      await this.queueForIdProduct(product.id);
      return await this.productsGettersService.findOneWithRelations(product.id);
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
      await this.removeProductFiles(product.id, businessReq);
      await this.removeProductVariations(product.id, businessReq);
      await this.productsSettersService.remove(product, businessReq);
      await this.queueForIdCatalog(product.idCatalog, ActionsEnum.Decrement, businessReq);
      return true;
    }

    /**
     * Extract images and variations from product input data and remove them from the data object.
     * This prevents these fields from being saved directly to the product entity.
     * @param {CreateProductInput | UpdateProductInput} data - The product input data.
     * @returns {{ images?: ProductImageInput[], variations?: ProductVariationInput[] }} Object containing extracted images and variations.
     */
    private extractProductRelations(
      data: CreateProductInput | UpdateProductInput
    ): { images?: ProductImageInput[], variations?: ProductVariationInput[] } {
      const images = data.images;
      const variations = data.variations;
      delete data.images;
      delete data.variations;
      return { images, variations };
    }

    /**
     * Create product files (images) for a product.
     * Iterates through the provided images array and creates a ProductFile for each one,
     * associating them with the specified product ID.
     * @param {number} productId - The ID of the product to associate the images with.
     * @param {ProductImageInput[]} images - Array of image inputs containing imageCode and order.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<void>}
     */
    private async createProductImages(
      productId: number,
      images: ProductImageInput[],
      businessReq: IBusinessReq
    ): Promise<void> {
      for (const image of images) {
        image.idProduct = productId;
        await this.productFilesSettersService.create(image, businessReq);
      }
    }

    /**
     * Remove all product files (images) associated with a product.
     * Retrieves all ProductFile records for the specified product and removes them.
     * @param {number} productId - The ID of the product whose files should be removed.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<void>}
     */
    private async removeProductFiles(
      productId: number,
      businessReq: IBusinessReq
    ): Promise<void> {
      const files = await this.productFilesGettersService.findByProductId(productId);
      if (files && files.length > 0) await this.productFilesSettersService.remove(files, businessReq);
    }

    /**
     * Update product images by removing existing files and creating new ones.
     * First removes all existing product files, then creates new ones from the provided images array.
     * @param {number} productId - The ID of the product whose images should be updated.
     * @param {ProductImageInput[]} images - Array of image inputs containing imageCode and order.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<void>}
     */
    private async updateProductImages(
      productId: number,
      images: ProductImageInput[],
      businessReq: IBusinessReq
    ): Promise<void> {
      await this.removeProductFiles(productId, businessReq);
      await this.createProductImages(productId, images, businessReq);
    }

    /**
     * Create product variations for a product.
     * Iterates through the provided variations array and creates a ProductVariation for each one,
     * associating them with the specified product ID.
     * @param {number} productId - The ID of the product to associate the variations with.
     * @param {ProductVariationInput[]} variations - Array of variation inputs containing title and options.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<void>}
     */
    private async createProductVariations(
      productId: number,
      variations: ProductVariationInput[],
      businessReq: IBusinessReq
    ): Promise<void> {
      for (const variation of variations) {
        variation.idProduct = productId;
        await this.productVariationsSettersService.create(variation, businessReq);
      }
    }

    /**
     * Remove all product variations associated with a product.
     * Retrieves all ProductVariation records for the specified product and removes them.
     * @param {number} productId - The ID of the product whose variations should be removed.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<void>}
     */
    private async removeProductVariations(
      productId: number,
      businessReq: IBusinessReq
    ): Promise<void> {
      const variations = await this.productVariationsGettersService.findAllByProduct(productId);
      if (variations && variations.length > 0) {
        for (const variation of variations) {
          await this.productVariationsSettersService.remove(variation, businessReq);
        }
      }
    }

    /**
     * Update product variations by synchronizing existing variations with the provided ones.
     * Creates new variations, updates existing ones, and removes variations that are not in the provided array.
     * @param {number} productId - The ID of the product whose variations should be updated.
     * @param {ProductVariationInput[]} variations - Array of variation inputs containing title and options.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<void>}
     */
    private async updateProductVariations(
      productId: number,
      variations: ProductVariationInput[],
      businessReq: IBusinessReq
    ): Promise<void> {
      const existingVariations = await this.productVariationsGettersService.findAllByProduct(productId);
      const existingIds = new Set(existingVariations.map(v => v.id));
      const providedIds = new Set(variations.filter(v => v.id).map(v => v.id));

      // Remove variations that are not in the provided array
      for (const existing of existingVariations) {
        if (!providedIds.has(existing.id)) {
          await this.productVariationsSettersService.remove(existing, businessReq);
        }
      }

      // Create or update variations
      for (const variation of variations) {
        if (variation.id && existingIds.has(variation.id)) {
          // Update existing variation
          const existing = existingVariations.find(v => v.id === variation.id);
          if (existing) {
            await this.productVariationsSettersService.update(existing, {
              id: variation.id,
              title: variation.title,
              options: variation.options,
              idProduct: productId
            }, businessReq);
          }
        } else {
          // Create new variation
          await this.productVariationsSettersService.create({
            title: variation.title,
            options: variation.options,
            idProduct: productId
          }, businessReq);
        }
      }
    }

    /**
     * Enqueues background jobs triggered when a product is created: updates the product search index
     * and increments the catalog products count.
     * @param {number} idProduct - The ID of the created product.
     * @param {number} idCatalog - The ID of the catalog containing the product.
     * @param {ActionsEnum} action - The action to perform.
     */
    private async enqueueProductCreationJobs(
      idProduct: number,
      idCatalog: number,
      action: ActionsEnum,
      businessReq: IBusinessReq
    ) {
      await this.queueForIdProduct(idProduct);
      await this.queueForIdCatalog(idCatalog, action, businessReq);
    }

    /**
     * Queues the background job for the product search index.
     * @param {number} idProduct - The ID of the product.
     */
    private async queueForIdProduct(idProduct: number) {
      await this.searchDataQueue.add(
        SearchDataConsumerEnum.SearchDataProduct,
        { idProduct }
      );
    }

    /**
     * Queues the background job for the catalog products count.
     * @param {number} idCatalog - The ID of the catalog.
     * @param {ActionsEnum} action - The action to perform.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    private async queueForIdCatalog(
      idCatalog: number,
      action: ActionsEnum,
      businessReq: IBusinessReq
    ) {
      await this.catalogsQueue.add(
        CatalogsConsumerEnum.UpdateProductsCount,
        { idCatalog, action, businessReq }
      );
    }
}
