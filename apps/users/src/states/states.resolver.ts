import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { StateSchema } from '../../../../core/schemas';
import { StatesService } from '../../../../core/modules/states/states.service';
import { toStateSchema } from '../../../../core/common/functions';

/**
 * Resolver for States (geographic subdivisions of a country).
 */
@UsePipes(new ValidationPipe())
@Resolver(() => StateSchema)
export class StatesResolver {
    constructor(private readonly statesService: StatesService) {}

    /**
     * Get all states.
     * @returns {Promise<StateSchema[]>} List of all states
     */
    @Query(() => [StateSchema], { name: 'findAllStates' })
    async findAll(): Promise<StateSchema[]> {
        const states = await this.statesService.findAll();
        return states.map((state) => toStateSchema(state));
    }
}
