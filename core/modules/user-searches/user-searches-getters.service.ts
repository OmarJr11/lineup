import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { UserSearch } from '../../entities';

/**
 * Service that retrieves user search records.
 */
@Injectable()
export class UserSearchesGettersService extends BasicService<UserSearch> {
    constructor(
        @InjectRepository(UserSearch)
        private readonly userSearchRepository: Repository<UserSearch>,
    ) {
        super(userSearchRepository);
    }

    /**
     * Gets the most recent unique search terms for a user.
     * @param {number} idUser - The user ID.
     * @param {number} limit - Maximum number of search terms to return.
     * @returns {Promise<string[]>} Array of unique search terms, most recent first.
     */
    async findRecentSearchTerms(idUser: number, limit = 5): Promise<string[]> {
        const results = await this.userSearchRepository.query<{ search_term: string }[]>(
            `SELECT DISTINCT ON (LOWER(search_term)) search_term
             FROM system.user_searches
             WHERE id_creation_user = $1
             ORDER BY LOWER(search_term), creation_date DESC
             LIMIT $2`,
            [idUser, limit * 3],
        );
        const terms = (results || []).map((r) => r?.search_term).filter(Boolean);
        return [...new Set(terms)].slice(0, limit);
    }
}
