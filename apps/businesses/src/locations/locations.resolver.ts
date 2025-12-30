import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { LocationsService } from '../../../../core/modules/locations/locations.service';
import { CreateLocationInput } from '../../../../core/modules/locations/dto/create-location.input';
import { UpdateLocationInput } from '../../../../core/modules/locations/dto/update-location.input';
import { LocationSchema, PaginatedLocations } from '../../../../core/schemas';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { BusinessDec, Permissions, Response } from '../../../../core/common/decorators';
import { toLocationSchema } from '../../../../core/common/functions/locations.function';
import { LocationsPermission } from '../../../../core/common/enums';
import { locationsResponses } from '../../../../core/common/responses';

@UsePipes(new ValidationPipe())
@Resolver(() => LocationSchema)
export class LocationsResolver {
    constructor(private readonly locationsService: LocationsService) {}

    @Mutation(() => LocationSchema, { name: 'createLocation' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(LocationsPermission.CREATE)
    @Response(locationsResponses.create)
    @UseGuards(JwtAuthGuard, TokenGuard)
    async create(
        @Args('data') data: CreateLocationInput,
        @BusinessDec() businessReq: IBusinessReq
    ) {
        const location = await this.locationsService.create(data, businessReq);
        return toLocationSchema(location);
    }

    @Query(() => [LocationSchema], { name: 'findAllMyLocations' })
    @UseGuards(JwtAuthGuard, TokenGuard)
    async findAllMyLocations(@BusinessDec() businessReq: IBusinessReq) {
        const locations = await this.locationsService.findAllMyLocations(businessReq);
        return locations.map((location) => toLocationSchema(location));
    }

    @Query(() => LocationSchema, { name: 'findOneLocation' })
    async findOne(@Args('id', { type: () => Int }) id: number) {
        const location = await this.locationsService.findOne(id);
        return toLocationSchema(location);
    }

    @Mutation(() => LocationSchema, { name: 'updateLocation' })
    @UseGuards(JwtAuthGuard, TokenGuard)
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(LocationsPermission.UPDATE)
    @Response(locationsResponses.update)
    async update(
        @Args('data') data: UpdateLocationInput,
        @BusinessDec() businessReq: IBusinessReq
    ) {
        const location = await this.locationsService.update(data, businessReq);
        return toLocationSchema(location);
    }

    @Mutation(() => Boolean, { name: 'removeLocation' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(LocationsPermission.DELETE)
    @Response(locationsResponses.delete)
    async remove(
        @Args('id') id: number,
        @BusinessDec() businessReq: IBusinessReq
    ) {
        const result = await this.locationsService.remove(id, businessReq);
        return result;
    }
}
