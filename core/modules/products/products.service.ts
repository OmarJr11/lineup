import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { BasicService } from '../../common/services';
import { Product } from '../../entities';
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
import { ProductSkusSettersService } from '../product-skus/product-skus-setters.service';
import { ProductSkusGettersService } from '../product-skus/product-skus-getters.service';
import {
  cartesianProduct,
  generateSkuCode,
} from '../../common/helpers/cartesian-product.helper';
import { CreateProductVariationInput } from './dto/create-product-variation.input';
import { ProductVariationInput } from './dto/product-variation.input';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import {
  ActionsEnum,
  CatalogsConsumerEnum,
  QueueNamesEnum,
  SearchDataConsumerEnum,
} from '../../common/enums';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { ProductTagsService } from '../product-tags/product-tags.service';
import { FilesGettersService } from '../files/files-getters.service';
import { VariationOptions } from '../../common/types';

@Injectable({ scope: Scope.REQUEST })
export class ProductsService extends BasicService<Product> {
  constructor(
    @Inject(REQUEST)
    businessRequest: Request,
    @InjectRepository(Product)
    productRepository: Repository<Product>,
    private readonly productsSettersService: ProductsSettersService,
    private readonly productsGettersService: ProductsGettersService,
    private readonly productTagsService: ProductTagsService,
    private readonly productFilesSettersService: ProductFilesSettersService,
    private readonly productFilesGettersService: ProductFilesGettersService,
    private readonly productVariationsSettersService: ProductVariationsSettersService,
    private readonly productVariationsGettersService: ProductVariationsGettersService,
    private readonly productSkusSettersService: ProductSkusSettersService,
    private readonly productSkusGettersService: ProductSkusGettersService,
    private readonly catalogsGettersService: CatalogsGettersService,
    private readonly filesGettersService: FilesGettersService,
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
    businessReq: IBusinessReq,
  ): Promise<Product> {
    const idCatalog = data.idCatalog;
    const idBusiness = businessReq.businessId;
    await this.catalogsGettersService.checkIfExistsByIdAndBusinessId(
      idCatalog,
      idBusiness,
    );
    const { images, variations } = this.extractCreateProductRelations(data);

    let tags: string[] | undefined;
    if (images && images.length > 0) {
      tags = await this.getTagsFromImages(
        images.map((image) => image.imageCode),
      );
    }

    data.hasVariations = (variations?.length ?? 0) > 0;
    const product = await this.productsSettersService.create(data, businessReq);
    if (images && images.length > 0)
      await this.createProductImages(product.id, images, businessReq);
    if (variations && variations.length > 0)
      await this.createProductVariations(product.id, variations, businessReq);
    await this.createProductSkus(product.id, variations ?? [], {}, businessReq);

    if (tags && tags.length > 0) {
      await this.productTagsService.processAndUpdateProductTags(
        product.id,
        tags,
        businessReq,
      );
    }

    await this.enqueueProductCreationJobs(
      product.id,
      idCatalog,
      tags,
      ActionsEnum.Increment,
      businessReq,
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
   * Get all Products by Catalog
   * @param {number} idCatalog - The ID of the catalog
   * @param {string} search - search query
   * @returns {Promise<Product[]>}
   */
  async findAllByCatalog(
    idCatalog: number,
    search?: string,
  ): Promise<Product[]> {
    return await this.productsGettersService.getAllByCatalog(idCatalog, search);
  }

  /**
   * Get all Products by Catalog with pagination
   * @param {number} idCatalog - The ID of the catalog
   * @param {InfinityScrollInput} query - query parameters for pagination
   * @returns {Promise<Product[]>}
   */
  async getAllByCatalogPaginated(
    idCatalog: number,
    query: InfinityScrollInput,
  ): Promise<Product[]> {
    return await this.productsGettersService.getAllByCatalogPaginated(
      idCatalog,
      query,
    );
  }

  /**
   * Get all Products by Business with pagination
   * @param {number} idBusiness - The ID of the business
   * @param {InfinityScrollInput} query - query parameters for pagination
   * @returns {Promise<Product[]>}
   */
  async findAllByBusiness(
    idBusiness: number,
    query: InfinityScrollInput,
  ): Promise<Product[]> {
    return await this.productsGettersService.findAllByBusiness(
      idBusiness,
      query,
    );
  }

  /**
   * Get all Products by tag (name or slug) with pagination.
   * @param {string} tagNameOrSlug - Tag name or slug to filter by.
   * @param {InfinityScrollInput} query - Query parameters for pagination.
   * @returns {Promise<Product[]>} Array of products with the given tag.
   */
  async findAllByTag(
    tagNameOrSlug: string,
    query: InfinityScrollInput,
  ): Promise<Product[]> {
    return await this.productsGettersService.findAllByTag(tagNameOrSlug, query);
  }

  /**
   * Get all Products by multiple tags (name or slug) with pagination.
   * Returns products that have at least one of the specified tags.
   * @param {string[]} tagNamesOrSlugs - Tag names or slugs to filter by.
   * @param {InfinityScrollInput} query - Query parameters for pagination.
   * @returns {Promise<Product[]>} Array of products matching any of the given tags.
   */
  async findAllByTags(
    tagNamesOrSlugs: string[],
    query: InfinityScrollInput,
  ): Promise<Product[]> {
    return await this.productsGettersService.findAllByTags(
      tagNamesOrSlugs,
      query,
    );
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
    businessReq: IBusinessReq,
  ): Promise<Product> {
    const idBusiness = businessReq.businessId;
    const product = await this.productsGettersService.findOneByBusinessId(
      data.id,
      idBusiness,
    );
    const idCatalog = data.idCatalog || product.idCatalog;
    await this.catalogsGettersService.checkIfExistsByIdAndBusinessId(
      idCatalog,
      idBusiness,
    );
    const { images, variations } = this.extractProductRelations(data);

    let tags: string[] | undefined;
    if (images && images.length > 0) {
      tags = await this.getTagsFromImages(
        images.map((image) => image.imageCode),
      );
    }

    if (variations !== undefined) {
      (data as unknown as Record<string, unknown>).hasVariations =
        variations.length > 0;
    }
    await this.productsSettersService.update(product, data, businessReq);

    if (images && images.length > 0)
      await this.updateProductImages(product.id, images, businessReq);
    if (variations !== undefined) {
      const updateVariations = variations;
      await this.updateProductVariations(
        product.id,
        updateVariations,
        businessReq,
      );
      await this.syncProductSkus(
        product.id,
        { inputVariations: updateVariations },
        businessReq,
      );
    } else if (product.hasVariations) {
      await this.resetProductSkusToZero(product.id, businessReq);
    }

    if (tags && tags.length > 0) {
      await this.productTagsService.processAndUpdateProductTags(
        product.id,
        tags,
        businessReq,
      );
    }
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
    await this.removeProductSkus(product.id, businessReq);
    await this.removeProductVariations(product.id, businessReq);
    await this.productsSettersService.remove(product, businessReq);
    await this.queueForIdCatalog(
      product.idCatalog,
      ActionsEnum.Decrement,
      businessReq,
    );
    return true;
  }

  /**
   * Extract images and variations from CreateProductInput. Price and stock are not set on create.
   * @param {CreateProductInput} data - The create product input data.
   * @returns Extracted images and variations.
   */
  private extractCreateProductRelations(data: CreateProductInput): {
    images?: ProductImageInput[];
    variations?: CreateProductVariationInput[];
  } {
    const images = data.images;
    const variations = data.variations;
    delete data.images;
    delete data.variations;
    return { images, variations };
  }

  /**
   * Extract images and variations from UpdateProductInput.
   * Price and quantity are not updated via product update.
   * @param {UpdateProductInput} data - The update product input data.
   * @returns Extracted images and variations.
   */
  private extractProductRelations(data: UpdateProductInput): {
    images?: ProductImageInput[];
    variations?: ProductVariationInput[];
  } {
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
   */
  private async createProductImages(
    productId: number,
    images: ProductImageInput[],
    businessReq: IBusinessReq,
  ) {
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
   */
  private async removeProductFiles(
    productId: number,
    businessReq: IBusinessReq,
  ) {
    const files =
      await this.productFilesGettersService.findByProductId(productId);
    if (files && files.length > 0)
      await this.productFilesSettersService.remove(files, businessReq);
  }

  /**
   * Update product images by removing existing files and creating new ones.
   * First removes all existing product files, then creates new ones from the provided images array.
   * @param {number} productId - The ID of the product whose images should be updated.
   * @param {ProductImageInput[]} images - Array of image inputs containing imageCode and order.
   * @param {IBusinessReq} businessReq - The business request object.
   */
  private async updateProductImages(
    productId: number,
    images: ProductImageInput[],
    businessReq: IBusinessReq,
  ) {
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
   */
  private async createProductVariations(
    productId: number,
    variations: CreateProductVariationInput[],
    businessReq: IBusinessReq,
  ) {
    for (const variation of variations) {
      await this.productVariationsSettersService.create(
        {
          title: variation.title,
          options: variation.options.map((o) => o.value),
          idProduct: productId,
        } as unknown as ProductVariationInput,
        businessReq,
      );
    }
  }

  /**
   * Remove all product variations associated with a product.
   * Retrieves all ProductVariation records for the specified product and removes them.
   * @param {number} productId - The ID of the product whose variations should be removed.
   * @param {IBusinessReq} businessReq - The business request object.
   */
  private async removeProductVariations(
    productId: number,
    businessReq: IBusinessReq,
  ) {
    const variations =
      await this.productVariationsGettersService.findAllByProduct(productId);
    if (variations && variations.length > 0) {
      for (const variation of variations) {
        await this.productVariationsSettersService.remove(
          variation,
          businessReq,
        );
      }
    }
  }

  /**
   * Update product variations by synchronizing existing variations with the provided ones.
   * Creates new variations, updates existing ones, and removes variations that are not in the provided array.
   * @param {number} productId - The ID of the product whose variations should be updated.
   * @param {ProductVariationInput[]} variations - Array of variation inputs containing title and options.
   * @param {IBusinessReq} businessReq - The business request object.
   */
  private async updateProductVariations(
    productId: number,
    variations: ProductVariationInput[],
    businessReq: IBusinessReq,
  ) {
    const existingVariations =
      await this.productVariationsGettersService.findAllByProduct(productId);
    const existingIds = new Set(existingVariations.map((v) => v.id));
    const providedIds = new Set(
      variations.filter((v) => v.id).map((v) => v.id),
    );

    // Remove variations that are not in the provided array
    for (const existing of existingVariations) {
      if (!providedIds.has(existing.id)) {
        await this.productVariationsSettersService.remove(
          existing,
          businessReq,
        );
      }
    }

    // Create or update variations
    for (const variation of variations) {
      if (variation.id && existingIds.has(variation.id)) {
        const existing = existingVariations.find((v) => v.id === variation.id);
        if (existing) {
          await this.productVariationsSettersService.update(
            existing,
            {
              id: variation.id,
              title: variation.title,
              options: variation.options.map((o) => o.value),
              idProduct: productId,
            } as unknown as ProductVariationInput,
            businessReq,
          );
        }
      } else {
        await this.productVariationsSettersService.create(
          {
            title: variation.title,
            options: variation.options.map((o) => o.value),
            idProduct: productId,
          } as unknown as ProductVariationInput,
          businessReq,
        );
      }
    }
  }

  /**
   * Create product SKUs. For products without variations: one SKU with empty variationOptions.
   * For products with variations: one SKU per combination (cartesian product).
   * All SKUs are created with quantity 0; use the stock management feature to set quantities.
   * Price per SKU: from priceData for simple products, or from getPriceForSku for variations.
   * @param {number} productId - The product ID
   * @param {CreateProductVariationInput[]} variations - The variations of the product (from CreateProductInput)
   * @param {Object} priceData - Price data: price/idCurrency for simple, or getPriceForSku for variations
   * @param {IBusinessReq} businessReq - The business request
   */
  private async createProductSkus(
    productId: number,
    variations: (CreateProductVariationInput | ProductVariationInput)[],
    priceData: {
      price?: number;
      idCurrency?: number;
      getPriceForSku?: (
        variationOptions: VariationOptions,
      ) => { price: number; idCurrency: number } | undefined;
    },
    businessReq: IBusinessReq,
  ) {
    const toVariationOptionsArray = (record: VariationOptions) =>
      Object.entries(record).map(([variationTitle, option]) => ({
        variationTitle,
        option,
      }));
    const skuPayload = (
      variationOptions: Record<string, string>,
      quantity: number | null = null,
    ) => {
      const priceInfo =
        variations.length === 0
          ? priceData.price != null && priceData.idCurrency != null
            ? { price: priceData.price, idCurrency: priceData.idCurrency }
            : undefined
          : priceData.getPriceForSku?.(variationOptions);
      return {
        idProduct: productId,
        skuCode: generateSkuCode(productId, variationOptions),
        variationOptions: toVariationOptionsArray(variationOptions),
        quantity,
        ...(priceInfo
          ? { price: priceInfo.price, idCurrency: priceInfo.idCurrency }
          : {}),
      };
    };
    if (variations.length === 0) {
      await this.productSkusSettersService.create(skuPayload({}), businessReq);
      return;
    }
    const variationDefs = variations.map((v) => ({
      title: v.title,
      options: v.options.map((o) => o.value),
    }));
    const titles = variationDefs.map((v) => v.title);
    const optionArrays = variationDefs.map((v) => v.options);
    const combinations = cartesianProduct(optionArrays);
    for (const combo of combinations) {
      const variationOptions: VariationOptions = {};
      titles.forEach((title, i) => {
        variationOptions[title] = combo[i];
      });
      await this.productSkusSettersService.create(
        skuPayload(variationOptions),
        businessReq,
      );
    }
  }

  /**
   * Sync product SKUs to match current variations. Removes obsolete SKUs, creates new ones.
   * All SKUs are created with quantity 0 and no price (reset). Handles variation changes:
   * 2→4, 2→1, or any structure change without damaging the product.
   */
  private async syncProductSkus(
    productId: number,
    _priceData: { inputVariations?: ProductVariationInput[] },
    businessReq: IBusinessReq,
  ): Promise<void> {
    const variations =
      await this.productVariationsGettersService.findAllByProduct(productId);
    const existingSkus =
      await this.productSkusGettersService.findAllByProduct(productId);
    for (const sku of existingSkus) {
      await this.productSkusSettersService.remove(sku, businessReq);
    }
    const toVariationOptionsArray = (record: VariationOptions) =>
      Object.entries(record).map(([variationTitle, option]) => ({
        variationTitle,
        option,
      }));
    const skuPayload = (variationOptions: VariationOptions) => ({
      idProduct: productId,
      skuCode: generateSkuCode(productId, variationOptions),
      variationOptions: toVariationOptionsArray(variationOptions),
      quantity: null,
    });
    if (variations.length === 0) {
      await this.productSkusSettersService.create(skuPayload({}), businessReq);
      return;
    }
    const variationDefs = variations.map((v) => ({
      title: v.title,
      options: v.options,
    }));
    const titles = variationDefs.map((v) => v.title);
    const optionArrays = variationDefs.map((v) => v.options);
    const combinations = cartesianProduct(optionArrays);
    for (const combo of combinations) {
      const variationOptions: Record<string, string> = {};
      titles.forEach((title, i) => {
        variationOptions[title] = combo[i];
      });
      await this.productSkusSettersService.create(
        skuPayload(variationOptions),
        businessReq,
      );
    }
  }

  /**
   * Resets all SKUs of a product with variations to quantity 0 and removes price.
   * Used when updating product data (other than variations) for variation products.
   */
  private async resetProductSkusToZero(
    productId: number,
    businessReq: IBusinessReq,
  ): Promise<void> {
    const skus =
      await this.productSkusGettersService.findAllByProduct(productId);
    for (const sku of skus) {
      await this.productSkusSettersService.update(
        sku,
        { quantity: null, price: null, idCurrency: null },
        businessReq,
      );
    }
  }

  /**
   * Remove all product SKUs for a product.
   */
  private async removeProductSkus(
    productId: number,
    businessReq: IBusinessReq,
  ): Promise<void> {
    const skus =
      await this.productSkusGettersService.findAllByProduct(productId);
    for (const sku of skus) {
      await this.productSkusSettersService.remove(sku, businessReq);
    }
  }

  /**
   * Enqueues background jobs triggered when a product is created: updates the product search index
   * and increments the catalog products count.
   * @param {number} idProduct - The ID of the created product.
   * @param {number} idCatalog - The ID of the catalog containing the product.
   * @param {string[]} tags - The tags of the product.
   * @param {ActionsEnum} action - The action to perform.
   * @param {IBusinessReq} businessReq - The business request object.
   */
  private async enqueueProductCreationJobs(
    idProduct: number,
    idCatalog: number,
    tags: string[],
    action: ActionsEnum,
    businessReq: IBusinessReq,
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
      { idProduct },
      { delay: 1000 * 60 },
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
    businessReq: IBusinessReq,
  ) {
    await this.catalogsQueue.add(
      CatalogsConsumerEnum.UpdateProductsCount,
      { idCatalog, action, businessReq },
      { delay: 1000 * 60 },
    );
  }

  /**
   * Get tags from images.
   * @param {string[]} images - The images to get tags from.
   * @returns {Promise<string[]>} The tags from the images.
   */
  private async getTagsFromImages(images: string[]): Promise<string[]> {
    const files = await this.filesGettersService.getImageByNames(images);
    const tags: string[] = [];
    for (const file of files) {
      if (file.tags && file.tags.length > 0) {
        file.tags.forEach((tag) => tags.push(tag));
      }
    }
    return [...new Set(tags)];
  }
}
