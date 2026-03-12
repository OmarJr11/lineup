import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Tag } from '../../entities';
import { toSlug } from '../../common/helpers/slug.helper';
import { BasicService } from '../../common/services/base.service';
import { IBusinessReq } from '../../common/interfaces';

/**
 * Service for tag operations.
 * Handles finding and creating tags for product categorization.
 */
@Injectable()
export class TagsService extends BasicService<Tag> {
    private readonly logger = new Logger(TagsService.name);
    
    constructor(
        @InjectRepository(Tag)
        private readonly tagRepository: Repository<Tag>,
    ) {
        super(tagRepository);
    }

    /**
     * Finds or creates tags by their names.
     * Normalizes names (trim, lowercase) and deduplicates.
     * @param {string[]} names - Tag names to find or create.
     * @returns {Promise<Tag[]>} Array of Tag entities.
     */
    async findOrCreateByNames(names: string[], businessReq: IBusinessReq): Promise<Tag[]> {
        if (!names?.length) return [];
        const normalized = [...new Set(names.map((n) => n.trim().toLowerCase()).filter(Boolean))];
        const existing = await this.findTagsByNames(normalized);
        const toCreate = await this.getTagsToCreate(normalized, existing);
        const created: Tag[] = [];
        for (const name of toCreate) {
            const saved = await this.createTags(name, businessReq);
            created.push(saved);
        }
        return [...existing, ...created];
    }

    /**
     * Finds tags by their names.
     * @param {string[]} names - The names of the tags.
     * @returns {Promise<Tag[]>} The tags.
     */
    async findTagsByNames(names: string[]): Promise<Tag[]> {
        return await this.find({ where: { name: In(names) } });
    }

    /**
     * Creates a tag.
     * @param {string} name - The name of the tag.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<Tag>} The created tag.
     */
    private async createTags(name: string, businessReq: IBusinessReq): Promise<Tag> {
        const data = { name, slug: toSlug(name) || `tag-${Date.now()}` }
        return await this.save(data, businessReq);
    }

    /**
     * Gets the names of the tags to create.
     * @param {string[]} normalized - The normalized of the tags.
     * @returns {Promise<string[]>} The names of the tags to create.
     */
    private async getTagsToCreate(normalized: string[], existing: Tag[]): Promise<string[]> {
        const existingNames = new Set(existing.map((t) => t.name));
        return normalized.filter((n) => !existingNames.has(n));
    }
}
