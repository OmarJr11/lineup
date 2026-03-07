import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BasicService } from '../../common/services';
import { LogError } from '../../common/helpers/logger.helper';
import { userResponses } from '../../common/responses';
import { Token } from '../../entities';

/**
 * Read-only service for token queries.
 * Singleton-scoped (no REQUEST), safe to inject in Guards and other contexts.
 */
@Injectable()
export class TokenGettersService extends BasicService<Token> {
  private readonly logger = new Logger(TokenGettersService.name);
  private readonly rToken = userResponses.token;

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>
  ) {
    super(tokenRepository);
  }

  /**
   * Find a token by its value or throw NotFoundException.
   * @param {string} token - The token string (JWT).
   * @returns {Promise<Token>} The found token.
   */
  async findOneByTokenOrFail(token: string): Promise<Token> {
    try {
      return await this.findOneWithOptionsOrFail({ where: { token } });
    } catch (error) {
      LogError(this.logger, error, this.findOneByTokenOrFail.name);
      throw new NotFoundException(this.rToken.tokenNotFound);
    }
  }
}
