import type { Currency } from '../../entities';
import type { CurrencySchema } from '../../schemas';

export function toCurrencySchema(currency: Currency): CurrencySchema {
  return currency as CurrencySchema;
}
