import { Currency } from '../../entities';
import { CurrencySchema } from '../../schemas';

export function toCurrencySchema(currency: Currency): CurrencySchema {
    return currency as CurrencySchema;
}
