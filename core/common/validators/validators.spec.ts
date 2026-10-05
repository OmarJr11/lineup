import { PriceCurrencyPairValidator } from './price-currency-pair.validator';
import { UrlOrPhoneExclusiveValidator } from './url-or-phone-exclusive.validator';
import { ValidationArguments } from 'class-validator';

describe('Common Validators', () => {
  describe('PriceCurrencyPairValidator', () => {
    const validator = new PriceCurrencyPairValidator();

    it('returns true when both price and idCurrency are provided', () => {
      const args = {
        object: { price: 100, idCurrency: 1 },
      } as ValidationArguments;
      expect(validator.validate(null, args)).toBe(true);
    });

    it('returns true when neither price nor idCurrency are provided', () => {
      const args = { object: {} } as ValidationArguments;
      expect(validator.validate(null, args)).toBe(true);
    });

    it('returns false when price is provided but idCurrency is missing', () => {
      const args = { object: { price: 50 } } as ValidationArguments;
      expect(validator.validate(null, args)).toBe(false);
    });

    it('returns false when idCurrency is provided but price is missing', () => {
      const args = { object: { idCurrency: 2 } } as ValidationArguments;
      expect(validator.validate(null, args)).toBe(false);
    });

    it('returns default message', () => {
      expect(validator.defaultMessage({} as any)).toBe(
        'price and idCurrency must both be provided or both be omitted',
      );
    });
  });

  describe('UrlOrPhoneExclusiveValidator', () => {
    const validator = new UrlOrPhoneExclusiveValidator();

    it('returns true when only url is provided', () => {
      const args = {
        object: { url: 'https://example.com' },
      } as ValidationArguments;
      expect(validator.validate(null, args)).toBe(true);
    });

    it('returns true when only phone is provided', () => {
      const args = { object: { phone: '+123456789' } } as ValidationArguments;
      expect(validator.validate(null, args)).toBe(true);
    });

    it('returns true when neither url nor phone are provided', () => {
      const args = { object: {} } as ValidationArguments;
      expect(validator.validate(null, args)).toBe(true);
    });

    it('returns false when both url and phone are provided', () => {
      const args = {
        object: { url: 'https://example.com', phone: '+123456789' },
      } as ValidationArguments;
      expect(validator.validate(null, args)).toBe(false);
    });

    it('returns default message', () => {
      expect(validator.defaultMessage({} as any)).toBe(
        'Only one of url or phone must be provided, not both',
      );
    });
  });
});
