import { Injectable } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { OrderEnum } from '../enum';

@ValidatorConstraint({ name: 'ValidateOrder', async: true })
@Injectable()
export class ValidateOrder implements ValidatorConstraintInterface {
    async validate(value: string) {
        if (value && value !== OrderEnum.ASC && value !== OrderEnum.DESC) {
            return false;
        }
        return true;
    }

    defaultMessage() {
        return 'You must send valid order';
    }
}
