import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from '../../entities';
import { BasicService } from '../../common/services';
import { Not, Repository } from 'typeorm';
import { locationsResponses } from '../../common/responses';
import { StatusEnum } from '../../common/enums';
import { LogError } from '../../common/helpers/logger.helper';
import { IBusinessReq } from '../../common/interfaces';

@Injectable()
export class LocationsGettersService extends BasicService<Location> {
    private logger = new Logger(LocationsGettersService.name);
    private readonly rList = locationsResponses.list;

    constructor(
        @InjectRepository(Location)
        private readonly locationRepository: Repository<Location>,
    ) {
        super(locationRepository);
    }

    /**
     * Get all Locations with pagination
     * @param {IBusinessReq} businessReq - The business request object.
     * @returns {Promise<Location[]>}
     */
    async findAllMyLocations(businessReq: IBusinessReq): Promise<Location[]> {
        return await this.createQueryBuilder('l')
            .where('l.status <> :status', { status: StatusEnum.DELETED })
            .andWhere(
                'l.idCreationBusiness = :idCreationBusiness',
                { idCreationBusiness: businessReq.businessId }
            )
            .getMany();
    }

    /**
     * Find a location by its ID.
     * @param {number} id - The ID of the location to find.
     * @returns {Promise<Location>} The found location.
     */
    async findOne(id: number): Promise<Location> {
        return await this.findOneWithOptionsOrFail({ 
            where: { id, status: Not(StatusEnum.DELETED) } 
        }).catch((error) => {
            LogError(this.logger, error, this.findOne.name);
            throw new NotFoundException(this.rList.notFound);
        });
    }
}
