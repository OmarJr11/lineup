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
     * @param rawText - Plain text from entity.
     * @param promptBuilder - Function that builds the user prompt.
     * @returns Enhanced text for tsvector.
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
     * @param product - Product entity with relations.
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
     * @param business - Business entity.
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
     * @param catalog - Catalog entity with relations.
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
}
