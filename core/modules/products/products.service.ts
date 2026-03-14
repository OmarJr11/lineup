import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
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
import { ProductSkusService } from '../product-skus/product-skus.service';
import { ProductSkusSettersService } from '../product-skus/product-skus-setters.service';
import { ProductSkusGettersService } from '../product-skus/product-skus-getters.service';
import { cartesianProduct, generateSkuCode } from '../../common/helpers/cartesian-product.helper';
import { CreateProductVariationInput } from './dto/create-product-variation.input';
import { ProductVariationInput } from './dto/product-variation.input';
import { InitialStockItemInput } from '../product-skus/dto/initial-stock-item.input';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { ActionsEnum, CatalogsConsumerEnum, ProductsConsumerEnum, QueueNamesEnum, SearchDataConsumerEnum } from '../../common/enums';
import { CatalogsGettersService } from '../catalogs/catalogs-getters.service';
import { ProductTagsService } from '../product-tags/product-tags.service';
import { FilesGettersService } from '../files/files-getters.service';
import { VariationOptions } from '../../common/types';

@Injectable({ scope: Scope.REQUEST })
export class ProductsService extends BasicService<Product> {
    private logger = new Logger(ProductsService.name);

    constructor(
      @Inject(REQUEST)
      private readonly businessRequest: Request,
      @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
      private readonly productsSettersService: ProductsSettersService,
      private readonly productsGettersService: ProductsGettersService,
      private readonly productTagsService: ProductTagsService,
      private readonly productFilesSettersService: ProductFilesSettersService,
      private readonly productFilesGettersService: ProductFilesGettersService,
      private readonly productVariationsSettersService: ProductVariationsSettersService,
      private readonly productVariationsGettersService: ProductVariationsGettersService,
      private readonly productSkusService: ProductSkusService,
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
      businessReq: IBusinessReq
    ): Promise<Product> {
      const idCatalog = data.idCatalog;
      const idBusiness = businessReq.businessId;
      await this.catalogsGettersService.checkIfExistsByIdAndBusinessId(idCatalog, idBusiness);
      const { images, variations, initialQuantity, price, idCurrency, getPriceForSku } = this.extractProductRelations(data);

      let tags: string[] | undefined;
      if (images && images.length > 0) {
        tags = await this.getTagsFromImages(images.map((image) => image.imageCode));
      }

      data.hasVariations = (variations?.length ?? 0) > 0;
      const product = await this.productsSettersService.create(data, businessReq);
      if (images && images.length > 0) await this
        .createProductImages(product.id, images, businessReq);
      if (variations && variations.length > 0) await this
        .createProductVariations(product.id, variations, businessReq);
      await this.createProductSkus(product.id, variations ?? [], { price, idCurrency, getPriceForSku }, businessReq);
      const hasVariations = (variations?.length ?? 0) > 0;
      if (hasVariations) {
        const initialStockFromVariations = this.buildInitialStockFromVariations(variations ?? []);
        if (initialStockFromVariations.length > 0) {
          await this.applyInitialStock(product.id, initialStockFromVariations, businessReq);
        }
      } else if (initialQuantity != null && initialQuantity !== 0) {
        await this.applyInitialStock(product.id, [{ quantityDelta: initialQuantity }], businessReq);
      }

      if(tags && tags.length > 0) {
        await this.productTagsService
          .processAndUpdateProductTags(product.id, tags, businessReq);
      }

      await this.enqueueProductCreationJobs(
        product.id,
        idCatalog,
        tags,
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
     * Get all Products by tag (name or slug) with pagination.
     * @param {string} tagNameOrSlug - Tag name or slug to filter by.
     * @param {InfinityScrollInput} query - Query parameters for pagination.
     * @returns {Promise<Product[]>} Array of products with the given tag.
     */
    async findAllByTag(
      tagNameOrSlug: string,
      query: InfinityScrollInput
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
      query: InfinityScrollInput
    ): Promise<Product[]> {
      return await this.productsGettersService.findAllByTags(tagNamesOrSlugs, query);
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
      const { images, variations, initialQuantity, price, idCurrency, getPriceForSku } = this.extractProductRelations(data);

      let tags: string[] | undefined;
      if (images && images.length > 0) {
        tags = await this.getTagsFromImages(images.map((image) => image.imageCode));
      }

      if (variations !== undefined) {
        (data as unknown as Record<string, unknown>).hasVariations = variations.length > 0;
      }
      await this.productsSettersService.update(product, data, businessReq);

      if (images && images.length > 0) await this.updateProductImages(product.id, images, businessReq);
      if (variations !== undefined) {
        const updateVariations = variations as ProductVariationInput[];
        await this.updateProductVariations(product.id, updateVariations, businessReq);
        await this.syncProductSkus(product.id, { price, idCurrency, getPriceForSku, inputVariations: updateVariations }, businessReq);
      }
      if (price != null || idCurrency != null) {
        await this.updateSkusPriceAndCurrency(product.id, { price, idCurrency }, businessReq);
      }
      const hasVariationsUpdate = variations !== undefined ? variations.length > 0 : product.hasVariations;
      if (!hasVariationsUpdate && initialQuantity != null && initialQuantity !== 0) {
        await this.applyInitialStock(product.id, [{ quantityDelta: initialQuantity }], businessReq);
      }
      
      if (tags && tags.length > 0) {
        await this.productTagsService
          .processAndUpdateProductTags(product.id, tags, businessReq);
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
      await this.queueForIdCatalog(product.idCatalog, ActionsEnum.Decrement, businessReq);
      return true;
    }

    /**
     * Extract images, variations, initialStock, price, and idCurrency from product input data and remove them from the data object.
     * Price and idCurrency are stored at SKU level, not product level.
     * @param {CreateProductInput | UpdateProductInput} data - The product input data.
     * @returns Extracted relations and price fields for SKUs.
     */
    private extractProductRelations(
      data: CreateProductInput | UpdateProductInput
    ): {
      images?: ProductImageInput[];
      variations?: (CreateProductVariationInput | ProductVariationInput)[];
      initialQuantity?: number;
      price?: number;
      idCurrency?: number;
      getPriceForSku?: (variationOptions: VariationOptions) => { price: number; idCurrency: number } | undefined;
    } {
      const images = data.images;
      const variations = data.variations;
      const initialQuantity = data.initialQuantity;
      const hasVariations = (variations?.length ?? 0) > 0;
      const getPriceForSku = hasVariations ? this.buildGetPriceForSku(variations ?? []) : undefined;
      const price = hasVariations ? undefined : data.priceCurrency?.price;
      const idCurrency = hasVariations ? undefined : data.priceCurrency?.idCurrency;
      delete data.images;
      delete data.variations;
      delete data.initialQuantity;
      delete data.priceCurrency;
      return { images, variations, initialQuantity, price, idCurrency, getPriceForSku };
    }

    /**
     * Builds a function that returns price for a SKU based on its variation options.
     * Uses the first variation that has optionPrices.
     */
    private buildGetPriceForSku(
      variations: (CreateProductVariationInput | ProductVariationInput)[]
    ): (variationOptions: VariationOptions) => { price: number; idCurrency: number } | undefined {
      const pricingVariation = variations.find((v) => v.optionPrices?.length);
      if (!pricingVariation?.optionPrices?.length) return () => undefined;
      const priceByOption = new Map(
        pricingVariation.optionPrices.map((p) => [p.option, { price: p.price, idCurrency: p.idCurrency }])
      );
      return (variationOptions: VariationOptions) => {
        const option = variationOptions[pricingVariation.title];
        return option != null ? priceByOption.get(option) : undefined;
      };
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
      variations: CreateProductVariationInput[],
      businessReq: IBusinessReq
    ): Promise<void> {
      for (const variation of variations) {
        await this.productVariationsSettersService.create(
          {
            title: variation.title,
            options: variation.options.map((o) => o.value),
            idProduct: productId,
          } as unknown as ProductVariationInput,
          businessReq
        );
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
          const existing = existingVariations.find(v => v.id === variation.id);
          if (existing) {
            await this.productVariationsSettersService.update(existing, {
              id: variation.id,
              title: variation.title,
              options: variation.options.map((o) => o.value),
              idProduct: productId
            } as unknown as ProductVariationInput, businessReq);
          }
        } else {
          await this.productVariationsSettersService.create({
            title: variation.title,
            options: variation.options.map((o) => o.value),
            idProduct: productId
          } as unknown as ProductVariationInput, businessReq);
        }
      }
    }

    /**
     * Apply initial stock to SKUs after product creation.
     * Matches by variationOptions when provided; otherwise by index (backward compat) or single SKU for simple products.
     * @param {number} productId - The product ID
     * @param {InitialStockItemInput[]} initialStock - Stock adjustments per SKU (with optional variationOptions)
     * @param {IBusinessReq} businessReq - The business request
     */
    private async applyInitialStock(
      productId: number,
      initialStock: InitialStockItemInput[],
      businessReq: IBusinessReq
    ): Promise<void> {
      const skus = await this.productSkusGettersService.findAllByProduct(productId);
      const skuByKey = new Map(skus.map((s) => [this.toSkuKey(s.variationOptions ?? {}), s]));
      for (const item of initialStock) {
        if (item.quantityDelta === 0) continue;
        const optionsRecord = this.toVariationOptionsRecord(item.variationOptions);
        const key = optionsRecord != null ? this.toSkuKey(optionsRecord) : '{}';
        const sku = skuByKey.get(key);
        if (!sku) continue;
        await this.productSkusService.adjustStock(
          { idProductSku: sku.id, quantityDelta: item.quantityDelta, notes: item.notes },
          businessReq,
        );
      }
    }

    /** Converts VariationOptionItemInput[] to VariationOptions. */
    private toVariationOptionsRecord(
      items?: { variationTitle: string; option: string }[]
    ): VariationOptions | undefined {
      if (!items?.length) return undefined;
      return items.reduce((acc, { variationTitle, option }) => {
        acc[variationTitle] = option;
        return acc;
      }, {} as VariationOptions);
    }

    /** Normalizes variationOptions to a comparable key (sorted keys). */
    private toSkuKey(variationOptions: VariationOptions): string {
      return JSON.stringify(
        Object.keys(variationOptions)
          .sort()
          .reduce((acc, k) => {
            acc[k] = variationOptions[k];
            return acc;
          }, {} as VariationOptions)
      );
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
        getPriceForSku?: (variationOptions: VariationOptions) => { price: number; idCurrency: number } | undefined;
      },
      businessReq: IBusinessReq
    ) {
      const toVariationOptionsArray = (record: VariationOptions) =>
        Object.entries(record).map(([variationTitle, option]) => ({ variationTitle, option }));
      const skuPayload = (variationOptions: Record<string, string>, quantity = 0) => {
        const priceInfo = variations.length === 0
          ? (priceData.price != null && priceData.idCurrency != null
            ? { price: priceData.price, idCurrency: priceData.idCurrency }
            : undefined)
          : priceData.getPriceForSku?.(variationOptions);
        return {
          idProduct: productId,
          skuCode: generateSkuCode(productId, variationOptions),
          variationOptions: toVariationOptionsArray(variationOptions),
          quantity,
          ...(priceInfo ? { price: priceInfo.price, idCurrency: priceInfo.idCurrency } : {}),
        };
      };
      if (variations.length === 0) {
        await this.productSkusSettersService.create(skuPayload({}, 0), businessReq);
        return;
      }
      const variationDefs = variations.map((v) => ({
        title: v.title,
        options: v.options.map((o) => o.value),
        optionsWithStock: v.options,
      }));
      const titles = variationDefs.map((v) => v.title);
      const optionArrays = variationDefs.map((v) => v.options);
      const combinations = cartesianProduct(optionArrays);
      for (const combo of combinations) {
        const variationOptions: VariationOptions = {};
        titles.forEach((title, i) => { variationOptions[title] = combo[i]; });
        await this.productSkusSettersService.create(skuPayload(variationOptions, 0), businessReq);
      }
    }

    /** Builds InitialStockItemInput[] from variations for applyInitialStock (creates StockMovement records). */
    private buildInitialStockFromVariations(
      variations: (CreateProductVariationInput | ProductVariationInput)[]
    ): InitialStockItemInput[] {
      if (variations.length === 0) return [];
      const variationDefs = variations.map((v) => ({
        title: v.title,
        options: v.options.map((o) => o.value),
        optionsWithStock: v.options,
      }));
      const titles = variationDefs.map((v) => v.title);
      const optionArrays = variationDefs.map((v) => v.options);
      const combinations = cartesianProduct(optionArrays);
      return combinations
        .map((combo) => {
          const variationOptions = titles.map((title, i) => ({ variationTitle: title, option: combo[i] }));
          const firstOption = variationDefs[0]?.optionsWithStock?.find((o) => o.value === combo[0]);
          const quantityDelta = firstOption?.initialStock ?? 0;
          return { variationOptions, quantityDelta };
        })
        .filter((item) => item.quantityDelta !== 0);
    }

    /**
     * Sync product SKUs to match current variations. Removes obsolete SKUs, creates new ones,
     * preserves quantity and price for existing matching SKUs.
     * For variations: uses getPriceForSku per SKU when provided, else keeps existing SKU prices.
     */
    private async syncProductSkus(
      productId: number,
      priceData: {
        price?: number;
        idCurrency?: number;
        getPriceForSku?: (variationOptions: VariationOptions) => { price: number; idCurrency: number } | undefined;
        inputVariations?: ProductVariationInput[];
      },
      businessReq: IBusinessReq
    ): Promise<void> {
      const variations = await this.productVariationsGettersService.findAllByProduct(productId);
      const inputVariations = priceData.inputVariations;
      const existingSkus = await this.productSkusGettersService.findAllByProduct(productId);
      const quantityByKey = new Map<string, number>();
      const priceByKey = new Map<string, { price: number; idCurrency: number }>();
      for (const sku of existingSkus) {
        const key = JSON.stringify(Object.keys(sku.variationOptions).sort().reduce((acc, k) => {
          acc[k] = sku.variationOptions[k]; return acc;
        }, {} as VariationOptions));
        quantityByKey.set(key, sku.quantity);
        if (sku.price != null && sku.idCurrency != null) {
          priceByKey.set(key, { price: Number(sku.price), idCurrency: sku.idCurrency });
        }
      }
      const firstSkuWithPrice = existingSkus.find(s => s.price != null && s.idCurrency != null);
      const defaultPrice = priceData.price != null && priceData.idCurrency != null
        ? { price: priceData.price, idCurrency: priceData.idCurrency }
        : (firstSkuWithPrice ? { price: Number(firstSkuWithPrice.price!), idCurrency: firstSkuWithPrice.idCurrency! } : undefined);
      for (const sku of existingSkus) {
        await this.productSkusSettersService.remove(sku, businessReq);
      }
      const toVariationOptionsArray = (record: VariationOptions) =>
        Object.entries(record).map(([variationTitle, option]) => ({ variationTitle, option }));
      const skuPayload = (variationOptions: VariationOptions, quantity: number, priceInfo?: { price: number; idCurrency: number }) => ({
        idProduct: productId,
        skuCode: generateSkuCode(productId, variationOptions),
        variationOptions: toVariationOptionsArray(variationOptions),
        quantity,
        ...(priceInfo ? { price: priceInfo.price, idCurrency: priceInfo.idCurrency } : {}),
      });
      const getPriceForCombo = (variationOptions: VariationOptions) =>
        priceByKey.get(JSON.stringify(variationOptions)) ??
        priceData.getPriceForSku?.(variationOptions) ??
        defaultPrice;
      if (variations.length === 0) {
        const key = '{}';
        const quantity = quantityByKey.get(key) ?? 0;
        const priceInfo = getPriceForCombo({});
        await this.productSkusSettersService.create(skuPayload({}, quantity, priceInfo), businessReq);
        return;
      }
      const variationDefs = variations.map((v) => ({ title: v.title, options: v.options }));
      const titles = variationDefs.map((v) => v.title);
      const optionArrays = variationDefs.map((v) => v.options);
      const combinations = cartesianProduct(optionArrays);
      const firstVariationOptions = inputVariations?.[0]?.options;
      for (const combo of combinations) {
        const variationOptions: Record<string, string> = {};
        titles.forEach((title, i) => { variationOptions[title] = combo[i]; });
        const quantity = quantityByKey.get(JSON.stringify(variationOptions)) ?? 0;
        const priceInfo = getPriceForCombo(variationOptions);
        await this.productSkusSettersService.create(skuPayload(variationOptions, quantity, priceInfo), businessReq);
      }
    }

    /**
     * Updates price and idCurrency on all SKUs of a product.
     * Used when updating product with new price/currency without changing variations.
     */
    private async updateSkusPriceAndCurrency(
      productId: number,
      priceData: { price?: number; idCurrency?: number },
      businessReq: IBusinessReq
    ): Promise<void> {
      if (priceData.price == null || priceData.idCurrency == null) return;
      const skus = await this.productSkusGettersService.findAllByProduct(productId);
      for (const sku of skus) {
        await this.productSkusSettersService.update(sku, { price: priceData.price, idCurrency: priceData.idCurrency }, businessReq);
      }
    }

    /**
     * Remove all product SKUs for a product.
     */
    private async removeProductSkus(
      productId: number,
      businessReq: IBusinessReq
    ): Promise<void> {
      const skus = await this.productSkusGettersService.findAllByProduct(productId);
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
        { idProduct }, { delay: 1000 * 60 }
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
        { idCatalog, action, businessReq }, { delay: 1000 * 60 }
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
        if (file.tags && file.tags.length > 0) { file.tags.forEach(tag => tags.push(tag)); }
      }
      return [...new Set(tags)];
    }
}
