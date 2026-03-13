import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductTag } from '../../entities';
import { GeminiService } from '../gemini/gemini.service';
import { TagsService } from '../tags/tags.service';
import { ProductsGettersService } from '../products/products-getters.service';
import { IBusinessReq } from '../../common/interfaces';
import { BasicService } from '../../common/services';
import { LogError } from '../../common/helpers';
import { productTagsResponses } from '../../common/responses';

/** System instruction for translating product tags to Spanish. */
const TRANSLATE_TAGS_SYSTEM_INSTRUCTION = `You are a specialized translator. Translate product tags/labels to Spanish in a natural and accurate way.
- You MUST return EXACTLY one translation per input tag, in the SAME order.
- Output format: one translation per line, no numbering, no explanations, no extra text.
- Use common Latin American Spanish terms when applicable.
- If a tag is already in Spanish, return it as is.
- Never skip or merge tags. Each input tag produces exactly one output line.
- IMPORTANT: Always translate English words to their Spanish equivalent. Do not leave anglicisms or loanwords unchanged (e.g. "Gadget" → "aparato" or "dispositivo", not "Gadget").`;

/**
 * Service for managing product-tag relationships.
 * Operates directly on the product_tags table via ProductTag entity.
 */
@Injectable()
export class ProductTagsService extends BasicService<ProductTag> {
    private readonly logger = new Logger(ProductTagsService.name);
    private readonly rCreate = productTagsResponses.create;
    private readonly rDelete = productTagsResponses.delete;

    constructor(
        @InjectRepository(ProductTag)
        private readonly productTagRepository: Repository<ProductTag>,
        private readonly geminiService: GeminiService,
        private readonly tagsService: TagsService,
        private readonly productsGettersService: ProductsGettersService,
    ) {
        super(productTagRepository);
    }

    /**
     * Translates tags to Spanish, saves them in Tag entity, and inserts rows in product_tags.
     * @param {number} idProduct - The product ID.
     * @param {string[]} tags - Raw tags (e.g. from Vision API, possibly in English).
     * @param {IBusinessReq} businessReq - The business request object.
     */
    async processAndUpdateProductTags(
        idProduct: number,
        tags: string[],
        businessReq: IBusinessReq
    ): Promise<void> {
        const translatedTags = await this.translateTagsToSpanish(tags);
        if (translatedTags.length === 0) return;
        await this.productsGettersService.findOne(idProduct);
        const tagEntities = await this.tagsService
            .findOrCreateByNames(translatedTags, businessReq);
        await this.deleteProductTags(idProduct, businessReq);
        const productTags = tagEntities.map((tag) => ({ idProduct, idTag: tag.id }));
        await this.save(productTags, businessReq);
    }

    /**
     * Saves the product tags.
     * @param {{ idProduct: number, idTag: number }[]} productTags - The product tags.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    async saveProductTags(
        productTags: { idProduct: number, idTag: number }[], 
        businessReq: IBusinessReq
    ) {
        try {
            await this.save(productTags, businessReq);
        } catch (error) {
            LogError(this.logger, error, this.saveProductTags.name, businessReq);
            throw new InternalServerErrorException(this.rCreate.error);
        }
    }

    /**
     * Deletes the product tags.
     * @param {number} idProduct - The product ID.
     * @param {IBusinessReq} businessReq - The business request object.
     */
    async deleteProductTags(idProduct: number, businessReq: IBusinessReq) {
        const productTags = await this.find({ where: { idProduct } });
        try {
            await this.deleteEntity(productTags, { data: businessReq});
        } catch (error) {
            LogError(this.logger, error, this.deleteProductTags.name, businessReq);
            throw new InternalServerErrorException(this.rDelete.error);
        }
    }

    /**
     * Translates an array of tags to Spanish using Gemini.
     * @param {string[]} tags - Tags (e.g. from Vision API, in English).
     * @returns {Promise<string[]>} Tags translated to Spanish.
     */
    private async translateTagsToSpanish(tags: string[]): Promise<string[]> {
        if (tags.length === 0) return [];
        const prompt = `Translate these ${tags.length} product tags to Spanish. Return exactly ${tags.length} lines, one translation per line:\n${tags.join('\n')}`;
        const result = await this.geminiService.generateContent({
            contents: prompt,
            systemInstruction: TRANSLATE_TAGS_SYSTEM_INSTRUCTION,
            config: { temperature: 0.2, maxOutputTokens: 1024 },
        });
        const text = (result.text || '').trim();
        if (!text) return tags;
        const translated = text
            .split(/\n/)
            .map((s) => s.replace(/^\d+\.\s*/, '').trim())
            .filter(Boolean);
        if (translated.length !== tags.length) {
            this.logger.warn(
                `translateTagsToSpanish: expected ${tags.length} tags, got ${translated.length}. Using originals for missing.`
            );
            return tags.map((tag, i) => translated[i] ?? tag);
        }
        return translated;
    }
}
