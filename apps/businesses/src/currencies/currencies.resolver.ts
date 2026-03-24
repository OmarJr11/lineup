import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import {
  BcvOfficialRatesSchema,
  CurrencySchema,
} from '../../../../core/schemas';
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

  /**
   * Latest BCV official EUR/USD snapshot from Redis (`bcv:official:snapshot`).
   */
  @Query(() => BcvOfficialRatesSchema, {
    name: 'findBcvOfficialRates',
    nullable: true,
  })
  async findBcvOfficialRates(): Promise<BcvOfficialRatesSchema> {
    const snapshot =
      await this.currenciesService.findBcvOfficialRatesFromCache();
    if (snapshot === null) {
      return null;
    }
    return snapshot;
  }
}
