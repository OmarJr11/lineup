import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotAcceptableException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BasicService } from '../../common/services';
import { State } from '../../entities';
import { Repository } from 'typeorm';
import { StatesGettersService } from './states-getters.service';
import { StatesSettersService } from './states-setters.service';
import { CreateStateInput } from './dto/create-state.input';
import { UpdateStateInput } from './dto/update-state.input';
import { IUserReq } from '../../common/interfaces';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { statesResponses } from '../../common/responses';
import { LogError } from '../../common/helpers/logger.helper';

@Injectable()
export class StatesService extends BasicService<State> {
  private logger = new Logger(StatesService.name);

  constructor(
    @Inject(REQUEST) private readonly req: Request,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    private readonly statesGettersService: StatesGettersService,
    private readonly statesSettersService: StatesSettersService,
  ) {
    super(stateRepository, req);
  }

  /**
   * Create State
   * @param {CreateStateInput} data - Data to create a state
   * @param {IUserReq} userReq - The user request object
   * @returns {Promise<State>}
   */
  @Transactional()
  async create(data: CreateStateInput, userReq: IUserReq): Promise<State> {
    const state = await this.statesSettersService.create(data, userReq);
    return await this.statesGettersService.findById(state.id);
  }

  /**
   * Find State by id
   * @param {number} id - State ID
   * @returns {Promise<State>}
   */
  async findById(id: number): Promise<State> {
    return await this.statesGettersService.findById(id);
  }

  /**
   * Find State by code
   * @param {string} code - State code
   * @returns {Promise<State>}
   */
  async findByCode(code: string): Promise<State> {
    return await this.statesGettersService.findByCode(code);
  }

  /**
   * Find all States
   * @returns {Promise<State[]>}
   */
  async findAll(): Promise<State[]> {
    return await this.statesGettersService.findAll();
  }

  /**
   * Update State
   * @param {UpdateStateInput} data - Data to update the state
   * @param {IUserReq} userReq - The user request object
   * @returns {Promise<State>}
   */
  @Transactional()
  async update(data: UpdateStateInput, userReq: IUserReq): Promise<State> {
    const state = await this.statesGettersService.findById(data.id);
    await this.validateUniqueFieldsOnUpdate(data, userReq);
    await this.statesSettersService.update(data, state, userReq);
    return await this.statesGettersService.findById(state.id);
  }

  /**
   * Remove State (soft delete)
   * @param {number} id - State ID
   * @param {IUserReq} userReq - The user request object
   * @returns {Promise<boolean>}
   */
  @Transactional()
  async remove(id: number, userReq: IUserReq): Promise<boolean> {
    const state = await this.statesGettersService.findById(id);
    await this.statesSettersService.remove(state, userReq);
    return true;
  }

  /**
   * Validates that name, code and capital are unique when updating a state.
   * Throws NotAcceptableException if any of the provided values already exist.
   * @param {UpdateStateInput} data - The update data containing the fields to validate
   * @param {IUserReq} userReq - The user making the request (for logging)
   * @throws {NotAcceptableException} When name, code or capital already exists for another state
   */
  private async validateUniqueFieldsOnUpdate(
    data: UpdateStateInput,
    userReq: IUserReq,
  ) {
    if (
      data.name &&
      (await this.statesGettersService.existsByName(data.name, data.id))
    ) {
      LogError(
        this.logger,
        statesResponses.update.nameAlreadyExists,
        this.update.name,
        userReq,
      );
      throw new NotAcceptableException(
        statesResponses.update.nameAlreadyExists,
      );
    }
    if (
      data.code &&
      (await this.statesGettersService.existsByCode(data.code, data.id))
    ) {
      LogError(
        this.logger,
        statesResponses.update.codeAlreadyExists,
        this.update.name,
        userReq,
      );
      throw new NotAcceptableException(
        statesResponses.update.codeAlreadyExists,
      );
    }
    if (
      data.capital &&
      (await this.statesGettersService.existsByCapital(data.capital, data.id))
    ) {
      LogError(
        this.logger,
        statesResponses.update.capitalAlreadyExists,
        this.update.name,
        userReq,
      );
      throw new NotAcceptableException(
        statesResponses.update.capitalAlreadyExists,
      );
    }
  }
}
