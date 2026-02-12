import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'UrlOrPhoneExclusive', async: false })
export class UrlOrPhoneExclusiveValidator implements ValidatorConstraintInterface {
    validate(_value: unknown, args: ValidationArguments): boolean {
        const obj = args.object as { url?: string; phone?: string };
        const hasUrl = obj.url != null && typeof obj.url === 'string' && obj.url.trim() !== '';
        const hasPhone = obj.phone != null && typeof obj.phone === 'string' && obj.phone.trim() !== '';
        return !(hasUrl && hasPhone);
    }

    defaultMessage(_args: ValidationArguments): string {
        return 'Only one of url or phone must be provided, not both';
    }
}
