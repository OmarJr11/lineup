import { OrderEnum } from '../enums';

export interface IPaginationOptions {
    limit: number;
    page: number;
    route?: string;
    order?: OrderEnum;
    orderBy?: string;
    where?: Array<{ [key: string]: any }>;
}
