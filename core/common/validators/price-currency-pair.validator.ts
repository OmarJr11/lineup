import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'PriceCurrencyPair', async: false })
export class PriceCurrencyPairValidator implements ValidatorConstraintInterface {
    validate(_value: any, args: ValidationArguments) {
        const obj = args.object as { price?: number; idCurrency?: number };
        const hasPrice = obj.price != null;
        const hasIdCurrency = obj.idCurrency != null;

        return (hasPrice && hasIdCurrency) || (!hasPrice && !hasIdCurrency);
    }

    defaultMessage(_args: ValidationArguments) {
        return 'price and idCurrency must both be provided or both be omitted';
    }
}
