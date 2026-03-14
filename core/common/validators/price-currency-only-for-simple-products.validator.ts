import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

/**
 * Validates that priceCurrency at product level is only provided for products without variations.
 * When variations are present, price must be sent inside each variation via priceCurrency.
 */
@ValidatorConstraint({ name: 'PriceCurrencyOnlyForSimpleProducts', async: false })
export class PriceCurrencyOnlyForSimpleProductsValidator implements ValidatorConstraintInterface {
    validate(value: unknown, args: ValidationArguments): boolean {
        const obj = args.object as { variations?: unknown[] };
        const hasVariations = (obj.variations?.length ?? 0) > 0;
        if (!hasVariations) return true;
        const hasPriceCurrency = value != null && typeof value === 'object' && (
            (value as { price?: unknown }).price != null ||
            (value as { idCurrency?: unknown }).idCurrency != null
        );
        return !hasPriceCurrency;
    }

    defaultMessage(_args: ValidationArguments): string {
        return 'priceCurrency at product level is only for products without variations; use priceCurrency inside variations for products with variations';
    }
}
