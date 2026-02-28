import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { ValidationMailsGettersService } from './validation-mails-getters.service';
import { ValidationMailsSettersService } from './validation-mails-setters.service';
import { BasicService } from '../../common/services/base.service';
import { ValidationMail } from '../../entities';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transactional } from 'typeorm-transactional-cls-hooked';


@Injectable({ scope: Scope.REQUEST })
export class ValidationMailsService extends BasicService<ValidationMail> {
    private readonly logger = new Logger(ValidationMailsService.name);

    constructor(
        @Inject(REQUEST)
        private readonly userRequest: Request,
        @InjectRepository(ValidationMail)
        private readonly validationMailRepository: Repository<ValidationMail>,
        private readonly validationMailsGettersService: ValidationMailsGettersService,
        private readonly validationMailsSettersService: ValidationMailsSettersService,
    ) {
        super(validationMailRepository, userRequest);
    }

    /**
     * Create a validation code
     * @param {string} email - The email to create the validation code
     * @returns {Promise<ValidationMail>} - The validation code
     */
    @Transactional()
    async createValidationCode(email: string): Promise<ValidationMail> {
        return await this.validationMailsSettersService.createValidationCode(email);
    }

    /**
     * Verify a validation code
     * @param {string} email - The email to verify the validation code
     * @param {string} code - The code to verify
     */
    @Transactional()
    async verifyCode(email: string, code: string) {
        const record = await this.validationMailsGettersService
            .findActiveByEmailAndCode(email, code);
        await this.validationMailsSettersService.verifyCode(record);
    }
}