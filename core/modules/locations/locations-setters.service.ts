import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateLocationInput } from './dto/create-location.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { Location } from '../../entities';
import { BasicService } from '../../common/services';
import { Repository } from 'typeorm';
import { IBusinessReq } from '../../common/interfaces';
import { Transactional } from 'typeorm-transactional-cls-hooked';
import { locationsResponses } from '../../common/responses';
import { LogError } from '../../common/helpers/logger.helper';

@Injectable()
export class LocationsSettersService extends BasicService<Location> {
    private logger = new Logger(LocationsSettersService.name);
    private readonly rCreate = locationsResponses.create;
    private readonly rUpdate = locationsResponses.update;
    private readonly rDelete = locationsResponses.delete;

    constructor(
        @InjectRepository(Location)
        private readonly locationRepository: Repository<Location>,
    ) {
        super(locationRepository);
    }

    /**
     * Creates a new location.
     * @param {CreateLocationInput} data - The data for the new location.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<Location>} The created location.
     */
    @Transactional()
    async create(
        data: CreateLocationInput,
        businessReq: IBusinessReq
    ): Promise<Location> {
        return await this.save(data, businessReq)
            .catch((error) => {
                LogError(this.logger, error, this.create.name, businessReq);
                throw new InternalServerErrorException(this.rCreate.error);
            });
    }

    /**
     * Update a location.
     * @param {Location} location - The location to update.
     * @param {UpdateLocationInput} data - The data for updating the location.
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<Location>} The updated location.
     */
    @Transactional()
    async update(
        location: Location,
        data: UpdateLocationInput,
        businessReq: IBusinessReq
    ): Promise<Location> {
        return await this.updateEntity(data, location, businessReq)
            .catch((error) => {
                LogError(this.logger, error, this.update.name, businessReq);
                throw new InternalServerErrorException(this.rUpdate.error);
            });
    }

    /**
     * Remove a location.
     * @param {Location} location - The location to remove.
     * @param {IBusinessReq} businessReq - The business request object.
     * @return {Promise<boolean>} True if the location was removed successfully.
     */
    @Transactional()
    async remove(location: Location, businessReq: IBusinessReq): Promise<boolean> {
        return await this.deleteEntityByStatus(location, businessReq).catch((error) => {
            LogError(this.logger, error, this.remove.name, businessReq);
            throw new InternalServerErrorException(this.rDelete.error);
        });
    }
}
