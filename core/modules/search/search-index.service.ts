import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Business, Catalog, Product } from '../../entities';
import { GeminiService } from '../gemini/gemini.service';
import {
    SEARCH_ENHANCEMENT_SYSTEM_INSTRUCTION,
    buildProductSearchEnhancementPrompt,
    buildBusinessSearchEnhancementPrompt,
    buildCatalogSearchEnhancementPrompt,
} from '../../common/prompts';
import { LogError } from '../../common/helpers';

/** PostgreSQL text search config used for tsvector. */
const TEXT_SEARCH_CONFIG = 'spanish';

/**
 * Service responsible for creating/updating search index rows
 * and generating search_vector content via AI-enhanced prompts.
 */
@Injectable()
export class SearchIndexService {
    private readonly logger = new Logger(SearchIndexService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly geminiService: GeminiService,
    ) {}

    /**
     * Enhances raw entity data into search-optimized text using Gemini.
     * Falls back to raw text if the API fails.
     * @param {string} rawText - Plain text from entity.
     * @param {Function} promptBuilder - Function that builds the user prompt.
     * @returns {string} Enhanced text for tsvector.
     */
    async enhanceSearchText(
        rawText: string,
        promptBuilder: (data: string) => string,
    ): Promise<string> {
        try {
            const result = await this.geminiService.generateContent({
                contents: promptBuilder(rawText),
                systemInstruction: SEARCH_ENHANCEMENT_SYSTEM_INSTRUCTION,
                config: { temperature: 0.3, maxOutputTokens: 512 },
            });
            return (result.text || rawText).trim();
        } catch (error) {
            LogError(this.logger, error, this.enhanceSearchText.name);
            return rawText;
        }
    }

    /**
     * Builds plain text from a Product for search enhancement.
     * @param {Product} product - Product entity with relations.
     * @returns {string} Plain text from the product.
     */
    buildProductRawText(product: Product): string {
        const parts: string[] = [
            product.title,
            product.subtitle ?? '',
            product.description ?? '',
            Array.isArray(product.tags) ? product.tags.join(' ') : '',
        ];
        if (product.catalog?.title) parts.push(product.catalog.title);
        if (product.business?.name) parts.push(product.business.name);
        if (product.variations?.length) {
            const varText = product.variations
                .map((v) => [v.title, ...(v.options ?? [])].join(' '))
                .join(' ');
            parts.push(varText);
        }
        return parts.filter(Boolean).join(' ').trim();
    }

    /**
     * Builds plain text from a Business for search enhancement.
     * @param {Business} business - Business entity with relations.
     * @returns {string} Plain text from the business.
     */
    buildBusinessRawText(business: Business): string {
        const parts: string[] = [
            business.name,
            business.description ?? '',
            business.path ?? '',
            Array.isArray(business.tags) ? business.tags.join(' ') : '',
        ];
        return parts.filter(Boolean).join(' ').trim();
    }

    /**
     * Builds plain text from a Catalog for search enhancement.
     * @param {Catalog} catalog - Catalog entity with relations.
     * @returns {string} Plain text from the catalog.
     */
    buildCatalogRawText(catalog: Catalog): string {
        const parts: string[] = [
            catalog.title ?? '',
            catalog.path ?? '',
            Array.isArray(catalog.tags) ? catalog.tags.join(' ') : '',
        ];
        if (catalog.business?.name) parts.push(catalog.business.name);
        if (catalog.products?.length) {
            const productTitles = catalog.products.map((p) => p.title ?? '').join(' ');
            parts.push(productTitles);
        }
        return parts.filter(Boolean).join(' ').trim();
    }

    /**
     * Creates or updates the product search index for a given product.
     * @param {Product} product - Product entity with relations.
     * @returns {Promise<void>} Promise that resolves when the product search index is created or updated.
     */
    async upsertProductSearchIndex(product: Product): Promise<void> {
        const rawText = this.buildProductRawText(product);
        const enhancedText = await this.enhanceSearchText(rawText, buildProductSearchEnhancementPrompt);
        const idProduct = product.id;
        const idBusiness = product.idCreationBusiness;
        const idCatalog = product.idCatalog;
        const likes = product.likes ?? 0;
        const visits = product.visits ?? 0;

        await this.dataSource.query(
            `INSERT INTO product_search_index (id_product, id_business, id_catalog, search_vector, likes, visits, creation_date, modification_date)
             VALUES ($1, $2, $3, to_tsvector($4, $5), $6, $7, NOW(), NOW())
             ON CONFLICT (id_product)
             DO UPDATE SET
               search_vector = to_tsvector($4, $5),
               likes = $6,
               visits = $7,
               modification_date = NOW()`,
            [idProduct, idBusiness, idCatalog, TEXT_SEARCH_CONFIG, enhancedText, likes, visits],
        );
    }

    /**
     * Creates or updates the business search index for a given business.
     * @param {Business} business - Business entity.
     * @returns {Promise<void>} Promise that resolves when the business search index is created or updated.
     */
    async upsertBusinessSearchIndex(business: Business): Promise<void> {
        const rawText = this.buildBusinessRawText(business);
        const enhancedText = await this.enhanceSearchText(rawText, buildBusinessSearchEnhancementPrompt);
        const idBusiness = business.id;
        const visits = business.visits ?? 0;
        const followers = business.followers ?? 0;

        await this.dataSource.query(
            `INSERT INTO business_search_index (id_business, search_vector, visits, followers, creation_date, modification_date)
             VALUES ($1, to_tsvector($2, $3), $4, $5, NOW(), NOW())
             ON CONFLICT (id_business)
             DO UPDATE SET
               search_vector = to_tsvector($2, $3),
               visits = $4,
               followers = $5,
               modification_date = NOW()`,
            [idBusiness, TEXT_SEARCH_CONFIG, enhancedText, visits, followers],
        );
    }

    /**
     * Creates or updates the catalog search index for a given catalog.
     * @param {Catalog} catalog - Catalog entity with relations.
     * @returns {Promise<void>} Promise that resolves when the catalog search index is created or updated.
     */
    async upsertCatalogSearchIndex(catalog: Catalog): Promise<void> {
        const rawText = this.buildCatalogRawText(catalog);
        const enhancedText = await this.enhanceSearchText(rawText, buildCatalogSearchEnhancementPrompt);
        const idCatalog = catalog.id;
        const idBusiness = catalog.idCreationBusiness;
        const visits = catalog.visits ?? 0;

        await this.dataSource.query(
            `INSERT INTO catalog_search_index (id_catalog, id_business, search_vector, visits, creation_date, modification_date)
             VALUES ($1, $2, to_tsvector($3, $4), $5, NOW(), NOW())
             ON CONFLICT (id_catalog)
             DO UPDATE SET
               search_vector = to_tsvector($3, $4),
               visits = $5,
               modification_date = NOW()`,
            [idCatalog, idBusiness, TEXT_SEARCH_CONFIG, enhancedText, visits],
        );
    }

    /**
     * Increments the visits count in business_search_index.
     * @param {number} idBusiness - Business ID.
     */
    async incrementBusinessVisits(idBusiness: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE business_search_index SET visits = visits + 1, modification_date = NOW() WHERE id_business = $1`,
            [idBusiness],
        );
    }

    /**
     * Increments the catalog_visits_total count in business_search_index.
     * @param {number} idBusiness - Business ID.
     */
    async incrementBusinessCatalogVisitsTotal(idBusiness: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE business_search_index SET catalog_visits_total = catalog_visits_total + 1, modification_date = NOW() WHERE id_business = $1`,
            [idBusiness],
        );
    }

    /**
     * Increments the product_visits_total count in business_search_index.
     * @param {number} idBusiness - Business ID.
     */
    async incrementBusinessProductVisitsTotal(idBusiness: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE business_search_index SET product_visits_total = product_visits_total + 1, modification_date = NOW() WHERE id_business = $1`,
            [idBusiness],
        );
    }

    /**
     * Increments the visits count in catalog_search_index.
     * @param {number} idCatalog - Catalog ID.
     */
    async incrementCatalogVisits(idCatalog: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE catalog_search_index SET visits = visits + 1, modification_date = NOW() WHERE id_catalog = $1`,
            [idCatalog],
        );
    }

    /**
     * Increments the product_visits_total count in catalog_search_index.
     * @param {number} idCatalog - Catalog ID.
     */
    async incrementCatalogProductVisitsTotal(idCatalog: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE catalog_search_index SET product_visits_total = product_visits_total + 1, modification_date = NOW() WHERE id_catalog = $1`,
            [idCatalog],
        );
    }

    /**
     * Increments the visits count in product_search_index.
     * @param idProduct - Product ID.
     */
    async incrementProductVisits(idProduct: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE product_search_index SET visits = visits + 1, modification_date = NOW() WHERE id_product = $1`,
            [idProduct],
        );
    }

    /**
     * Increments the followers count in business_search_index.
     * @param idBusiness - Business ID.
     */
    async incrementBusinessFollowers(idBusiness: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE business_search_index SET followers = followers + 1, modification_date = NOW() WHERE id_business = $1`,
            [idBusiness],
        );
    }

    /**
     * Decrements the followers count in business_search_index by one.
     * Uses GREATEST to avoid negative values.
     * @param idBusiness - Business ID.
     */
    async decrementBusinessFollowers(idBusiness: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE business_search_index SET followers = GREATEST(0, followers - 1), modification_date = NOW() WHERE id_business = $1`,
            [idBusiness],
        );
    }

    /**
     * Increments the likes count in product_search_index.
     * @param idProduct - Product ID.
     */
    async incrementProductLikes(idProduct: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE product_search_index SET likes = likes + 1, modification_date = NOW() WHERE id_product = $1`,
            [idProduct],
        );
    }

    /**
     * Decrements the likes count in product_search_index by one.
     * Uses GREATEST to avoid negative values.
     * @param idProduct - Product ID.
     */
    async decrementProductLikes(idProduct: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE product_search_index SET likes = GREATEST(0, likes - 1), modification_date = NOW() WHERE id_product = $1`,
            [idProduct],
        );
    }

    /**
     * Increments the product_likes_total count in catalog_search_index.
     * @param idCatalog - Catalog ID.
     */
    async incrementCatalogProductLikesTotal(idCatalog: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE catalog_search_index SET product_likes_total = product_likes_total + 1, modification_date = NOW() WHERE id_catalog = $1`,
            [idCatalog],
        );
    }

    /**
     * Decrements the product_likes_total count in catalog_search_index by one.
     * Uses GREATEST to avoid negative values.
     * @param idCatalog - Catalog ID.
     */
    async decrementCatalogProductLikesTotal(idCatalog: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE catalog_search_index SET product_likes_total = GREATEST(0, product_likes_total - 1), modification_date = NOW() WHERE id_catalog = $1`,
            [idCatalog],
        );
    }

    /**
     * Increments the product_likes_total count in business_search_index.
     * @param idBusiness - Business ID.
     */
    async incrementBusinessProductLikesTotal(idBusiness: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE business_search_index SET product_likes_total = product_likes_total + 1, modification_date = NOW() WHERE id_business = $1`,
            [idBusiness],
        );
    }

    /**
     * Decrements the product_likes_total count in business_search_index by one.
     * Uses GREATEST to avoid negative values.
     * @param idBusiness - Business ID.
     */
    async decrementBusinessProductLikesTotal(idBusiness: number): Promise<void> {
        await this.dataSource.query(
            `UPDATE business_search_index SET product_likes_total = GREATEST(0, product_likes_total - 1), modification_date = NOW() WHERE id_business = $1`,
            [idBusiness],
        );
    }
}
