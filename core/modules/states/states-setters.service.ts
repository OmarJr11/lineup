import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BasicService } from '../../common/services';
import { State } from '../../entities';
import { Repository } from 'typeorm';
import { IUserReq } from '../../common/interfaces';
import { LogError } from '../../common/helpers/logger.helper';
import { statesResponses } from '../../common/responses';
import { CreateStateInput } from './dto/create-state.input';
import { UpdateStateInput } from './dto/update-state.input';
import { Transactional } from 'typeorm-transactional-cls-hooked';

@Injectable()
export class StatesSettersService extends BasicService<State> {
  private logger = new Logger(StatesSettersService.name);
  private readonly rCreate = statesResponses.create;
  private readonly rUpdate = statesResponses.update;
  private readonly rDelete = statesResponses.delete;

  constructor(
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
  ) {
    super(stateRepository);
  }

  /**
   * Create State
   * @param {CreateStateInput} data - Data to create a state
   * @param {IUserReq} userReq - The user request object
   * @returns {Promise<State>}
   */
  @Transactional()
  async create(data: CreateStateInput, userReq: IUserReq): Promise<State> {
    try {
      return await this.save(data, userReq);
    } catch (error) {
      LogError(this.logger, error, this.create.name, userReq);
      throw new InternalServerErrorException(this.rCreate.error);
    }
  }

  /**
   * Update State
   * @param {UpdateStateInput} data - Data to update the state
   * @param {State} state - The state entity to update
   * @param {IUserReq} userReq - The user request object
   * @returns {Promise<State>}
   */
  @Transactional()
  async update(
    data: UpdateStateInput,
    state: State,
    userReq: IUserReq,
  ): Promise<State> {
    try {
      return (await this.updateEntity(data, state, userReq)) as State;
    } catch (error) {
      LogError(this.logger, error as Error, this.update.name, userReq);
      throw new InternalServerErrorException(this.rUpdate.error);
    }
  }

  /**
   * Remove State (soft delete)
   * @param {State} state - The state entity to remove
   * @param {IUserReq} userReq - The user request object
   */
  @Transactional()
  async remove(state: State, userReq: IUserReq): Promise<void> {
    try {
      await this.deleteEntityByStatus(state, userReq);
    } catch (error) {
      LogError(this.logger, error, this.remove.name, userReq);
      throw new InternalServerErrorException(this.rDelete.error);
    }
  }
}
