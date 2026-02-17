import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { VisitsService } from '../../../../core/modules/visits/visits.service';
import { OptionalJwtAuthGuard } from '../../../../core/common/guards';
import { UserDec } from '../../../../core/common/decorators';
import { IUserReq } from '../../../../core/common/interfaces';
import { RecordVisitInput } from './dto/record-visit.input';

/**
 * Resolver for recording visits to businesses, products, and catalogs.
 * The recordVisit mutation is public; when the user is logged in, the visit is attributed to them.
 */
@UsePipes(new ValidationPipe())
@Resolver()
export class VisitsResolver {
    constructor(private readonly visitsService: VisitsService) {}

    /**
     * Records a visit to a business, product, or catalog.
     * @param {RecordVisitInput} input - The visit input (type, id).
     * @param {IUserReq | null} user - The authenticated user, or null for anonymous.
     */
    @UseGuards(OptionalJwtAuthGuard)
    @Mutation(() => Boolean, { name: 'recordVisit' })
    async recordVisit(
        @Args('input') input: RecordVisitInput,
        @UserDec() user: IUserReq | null
    ): Promise<boolean> {
        await this.visitsService.recordVisit(input, user);
        return true;
    }
}
