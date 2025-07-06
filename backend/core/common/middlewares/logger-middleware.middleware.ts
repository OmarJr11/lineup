import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as _ from 'lodash';
import * as moment from 'moment';
import { EnvironmentsEnum } from '../enums';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private excludedFields = ['password'];

    constructor(
        private readonly configService: ConfigService
    ) {}

    use(request: Request, res: Response, next: NextFunction) {
        if (this.configService.get<string>('NODE_ENV') !== EnvironmentsEnum.Test) {
            const currentHour = new Date();

            let body = request.body;

            if (Buffer.isBuffer(body)) {
                body = JSON.parse(body.toString());
            }

            console.log(
                moment().format('YYYY-MM-DD HH:mm:ss'),
                currentHour.getTimezoneOffset(),
                request.headers['x-forwarded-for']
                    ? request.headers['x-forwarded-for']
                    : request.ip.split(':').pop(),
                request.method,
                request['_parsedUrl']['pathname'],
            );
        }
        next();
    }

    cleanObject(body: Record<string, any>) {
        for (const key in body) {
            if (body[key] === 'object') {
                body[key] = this.cleanObject(body[key]);
            } else if (this.excludedFields.some((e) => e === key)) {
                body[key] = '******';
            }
        }

        return body;
    }
}
