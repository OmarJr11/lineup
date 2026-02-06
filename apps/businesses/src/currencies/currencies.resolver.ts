import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { CurrencySchema } from '../../../../core/schemas';
import { CurrenciesService } from '../../../../core/modules/currencies/currencies.service';
import { toCurrencySchema } from '../../../../core/common/functions';

@UsePipes(new ValidationPipe())
@Resolver(() => CurrencySchema)
export class CurrenciesResolver {
    constructor(private readonly currenciesService: CurrenciesService) {}

    @Query(() => [CurrencySchema], { name: 'findAllCurrencies' })
    async findAll() {
        const currencies = await this.currenciesService.findAll();
        return currencies.map((currency) => toCurrencySchema(currency));
    }
}
