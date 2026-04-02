import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { UserSearch } from '../../entities';
import { IUserReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { Transactional } from 'typeorm-transactional-cls-hooked';

/**
 * Service that handles creating user search records.
 * Stores search terms for logged-in users to build personalized collections.
 */
@Injectable()
export class UserSearchesSettersService extends BasicService<UserSearch> {
  private readonly logger = new Logger(UserSearchesSettersService.name);

  constructor(
    @InjectRepository(UserSearch)
    private readonly userSearchRepository: Repository<UserSearch>,
  ) {
    super(userSearchRepository);
  }

  /**
   * Records a search performed by a logged-in user.
   * @param {string} searchTerm - The search query text.
   * @param {IUserReq} user - The authenticated user.
   */
  @Transactional()
  async create(searchTerm: string, user: IUserReq) {
    try {
      const normalizedTerm = (searchTerm || '').trim();
      if (!normalizedTerm) {
        return null as unknown as UserSearch;
      }
      await this.save(
        {
          idCreationUser: user.userId,
          searchTerm: normalizedTerm.slice(0, 255),
        },
        user,
      );
    } catch (error) {
      LogError(this.logger, error, this.create.name, user);
      return null as unknown as UserSearch;
    }
  }
}
