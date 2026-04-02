import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { FindOptionsWhere } from 'typeorm';
import { BasicService } from '../../common/services';
import { State } from '../../entities';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { statesResponses } from '../../common/responses';

@Injectable()
export class StatesGettersService extends BasicService<State> {
  private logger = new Logger(StatesGettersService.name);
  private readonly rList = statesResponses.list;

  constructor(
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
  ) {
    super(stateRepository);
  }

  /**
   * Find State by id
   * @param {number} id - State ID
   * @returns {Promise<State>}
   */
  async findById(id: number): Promise<State> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { id, status: Not(StatusEnum.DELETED) },
      });
    } catch (error) {
      LogError(this.logger, error, this.findById.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Find State by code
   * @param {string} code - State code (e.g. VE-A, VE-B)
   * @returns {Promise<State>}
   */
  async findByCode(code: string): Promise<State> {
    try {
      return await this.findOneWithOptionsOrFail({
        where: { code, status: Not(StatusEnum.DELETED) },
      });
    } catch (error) {
      LogError(this.logger, error, this.findByCode.name);
      throw new NotFoundException(this.rList.notFound);
    }
  }

  /**
   * Check if a state with the given name already exists.
   * @param {string} name - State name
   * @param {number} [excludeId] - State ID to exclude (for update scenarios)
   * @returns {Promise<boolean>}
   */
  async existsByName(name: string, excludeId?: number): Promise<boolean> {
    const where: FindOptionsWhere<State> = {
      name,
      status: Not(StatusEnum.DELETED),
    };
    if (excludeId !== undefined) where.id = Not(excludeId);
    const state = await this.findOneWithOptionsOrFail({ where });
    return !!state;
  }

  /**
   * Check if a state with the given code already exists.
   * @param {string} code - State code
   * @param {number} [excludeId] - State ID to exclude (for update scenarios)
   * @returns {Promise<boolean>}
   */
  async existsByCode(code: string, excludeId?: number): Promise<boolean> {
    const where: FindOptionsWhere<State> = {
      code,
      status: Not(StatusEnum.DELETED),
    };
    if (excludeId !== undefined) where.id = Not(excludeId);
    const state = await this.findOneWithOptionsOrFail({ where });
    return !!state;
  }

  /**
   * Check if a state with the given capital already exists.
   * @param {string} capital - State capital
   * @param {number} [excludeId] - State ID to exclude (for update scenarios)
   * @returns {Promise<boolean>}
   */
  async existsByCapital(capital: string, excludeId?: number): Promise<boolean> {
    const where: FindOptionsWhere<State> = {
      capital,
      status: Not(StatusEnum.DELETED),
    };
    if (excludeId !== undefined) where.id = Not(excludeId);
    const state = await this.findOneWithOptionsOrFail({ where });
    return !!state;
  }

  /**
   * Find all States
   * @returns {Promise<State[]>}
   */
  async findAll(): Promise<State[]> {
    try {
      return await this.find({
        where: { status: Not(StatusEnum.DELETED) },
        order: { name: 'ASC' },
      });
    } catch (error) {
      LogError(this.logger, error, this.findAll.name);
      throw new NotFoundException(this.rList.error);
    }
  }
}
