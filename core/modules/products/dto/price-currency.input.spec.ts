import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PriceCurrencyInput } from './price-currency.input';

describe('PriceCurrencyInput', () => {
  it('validates successfully when both price and idCurrency are provided', async () => {
    const input = plainToInstance(PriceCurrencyInput, {
      price: 25.5,
      idCurrency: 1,
    });

    const errors = await validate(input);
    expect(errors.length).toBe(0);
    expect(input.price).toBe(25.5);
    expect(input.idCurrency).toBe(1);
  });

  it('validates successfully when both price and idCurrency are omitted', async () => {
    const input = plainToInstance(PriceCurrencyInput, {});
    const errors = await validate(input);
    expect(errors.length).toBe(0);
  });

  it('fails validation when only price is provided', async () => {
    const input = plainToInstance(PriceCurrencyInput, {
      price: 20,
    });
    const errors = await validate(input);
    expect(errors.length).toBeGreaterThan(0);
  });
});
