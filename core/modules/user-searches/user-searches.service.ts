import { Injectable } from '@nestjs/common';
import { UserSearchesGettersService } from './user-searches-getters.service';
import { UserSearchesSettersService } from './user-searches-setters.service';
import { IUserReq } from '../../common/interfaces';
import { Transactional } from 'typeorm-transactional-cls-hooked';

/**
 * Service that orchestrates user search operations.
 */
@Injectable()
export class UserSearchesService {
  constructor(
    private readonly userSearchesSettersService: UserSearchesSettersService,
    private readonly userSearchesGettersService: UserSearchesGettersService,
  ) {}

  /**
   * Records a search when the user is logged in.
   * @param {string} searchTerm - The search query.
   * @param {IUserReq} user - The authenticated user.
   */
  @Transactional()
  async recordSearch(searchTerm: string, user: IUserReq) {
    const trimmed = (searchTerm || '').trim();
    await this.userSearchesSettersService.create(trimmed, user);
  }

  /**
   * Gets recent search terms for a user.
   * @param {number} idUser - The user ID.
   * @param {number} limit - Maximum number of terms.
   * @returns {Promise<string[]>} Recent unique search terms.
   */
  async getRecentSearchTerms(idUser: number, limit = 5): Promise<string[]> {
    return this.userSearchesGettersService.findRecentSearchTerms(idUser, limit);
  }
}
