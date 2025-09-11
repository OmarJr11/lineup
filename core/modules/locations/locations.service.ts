import { Inject, Injectable, Logger } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { Location } from '../../entities';
import { BasicService } from '../../common/services';
import { Repository } from 'typeorm';
import { IBusinessReq } from '../../common/interfaces';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { InfinityScrollInput } from 'core/common/dtos';
import { LocationsGettersService } from './locations-getters.service';
import { LocationsSettersService } from './locations-setters.service';

@Injectable()
export class LocationsService extends BasicService<Location> {
  private logger = new Logger(LocationsService.name);
      
  constructor(
    @Inject(REQUEST)
    private readonly businessRequest: Request,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly locationsGettersService: LocationsGettersService,
    private readonly locationsSettersService: LocationsSettersService,
  ) {
    super(locationRepository, businessRequest);
  }

  /**
   * Creates a new location.
   * @param data - The data for the new location.
   * @param businessReq - The business request object.
   * @returns {Promise<Location>} The created location.
   */
  @Transactional()
  async create(
    data: CreateLocationInput,
    businessReq: IBusinessReq
  ): Promise<Location> {
    const location = await this.locationsSettersService.create(data, businessReq);
    return await this.locationsGettersService.findOne(location.id);
  }

  /**
   * Get all Locations with pagination
   * @param {InfinityScrollInput} query - query parameters for pagination
   * @returns {Promise<Location[]>}
   */
  async findAll(query: InfinityScrollInput): Promise<Location[]> {
    return await this.locationsGettersService.findAll(query);
  }

  /**
   * Find a location by its ID.
   * @param {number} id - The ID of the location to find.
   * @returns {Promise<Location>} The found location.
   */
  async findOne(id: number): Promise<Location> {
    return await this.locationsGettersService.findOne(id);
  }

  /**
   * Update a location.
   * @param {UpdateLocationInput} data - The data for updating the location.
   * @param {IBusinessReq} businessReq - The business request object.
   * @returns {Promise<Location>} The updated location.
   */
  @Transactional()
  async update(
    data: UpdateLocationInput,
    businessReq: IBusinessReq
  ): Promise<Location> {
    const location = await this.locationsGettersService.findOne(data.id);
    await this.locationsSettersService.update(location, data, businessReq);
    return await this.locationsGettersService.findOne(location.id);
  }

  /**
   * Remove a location.
   * @param {number} id - The ID of the location to remove.
   * @param {IBusinessReq} businessReq - The business request object.
   * @return {Promise<boolean>} True if the location was removed successfully.
   */
  @Transactional()
  async remove(id: number, businessReq: IBusinessReq): Promise<boolean> {
    const location = await this.locationsGettersService.findOne(id);
    await this.locationsSettersService.remove(location, businessReq);
    return true;
  }
}
