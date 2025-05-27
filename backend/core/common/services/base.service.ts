import { Request } from 'express';
import {
    EntityManager,
    FindOneOptions,
    Not,
    ObjectLiteral,
    QueryRunner,
    RemoveOptions,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';
import { invalidReferersRequest } from '../helpers/requests.helper';
import _ = require('lodash');
import { IExtraDataToSave, IInfiniteScroll, ILogin, ILoginReturn, IUserReq, ReqWithCookies } from '../interfaces';
import { StatusEnum } from '../enum';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

export class BasicService<Entity extends ObjectLiteral> {
    private _connectionName = 'default';
    private defaultImages = [];
    private _manager: EntityManager | undefined;

    constructor(
        private readonly repository: Repository<Entity>,
        private readonly _request?: Request,
    ) {}

    async find(conditions: any) {
        return await this.repository.find(conditions);
    }

    async findOneOrFail(id: string | number | Date, options?: any): Promise<Entity> {
        if (!id) {
            throw new NotFoundException({
                status: false,
                message: 'The id cant be empty',
                code: '',
            });
        }

        if (options) {
            if (options.where) {
                options.where.id = id;
            } else {
                options = {
                    where: {
                        id,
                    },
                    relations: options.relations,
                };
            }
        } else {
            options = {
                where: { id },
            };
        }
        return this.cleanObjects(await this.repository.findOneOrFail(options));
    }

    async findByIdWithoutRelationsOrFail(id: number, error: any): Promise<Entity> {
        return await this.findOneOrFail(id, {
            where: { status: Not(StatusEnum.DELETED) },
        }).catch(() => {
            throw new ForbiddenException(error);
        });
    }

    findOneWithOptions(options: FindOneOptions<Entity>): Promise<Entity | null> {
        return this.repository.findOne(options);
    }

    findOneWithOptionsOrFail(options: FindOneOptions<Entity>): Promise<Entity | undefined> {
        return this.repository.findOneOrFail(options);
    }

    async findWithOptionsOrFail(options: FindOneOptions<Entity>): Promise<Entity[]> {
        const result = await this.repository.find(options);

        if (result.length === 0) {
            throw new NotFoundException({
                status: false,
                message: 'No results to this query',
                code: '4',
            });
        }

        result.forEach((e) => {
            this.cleanObjects(e);
        });

        return result;
    }

    async responseCookiesOrHeaders(req: ReqWithCookies, data: ILogin): Promise<ILoginReturn> {
        if (!invalidReferersRequest(req)) return data
        req.headers['token'] = data.token;
        req.headers['refreshToken'] = data.refreshToken;
        return data;
    }

    async save(data: any, user?: IUserReq, extraData?: IExtraDataToSave) {
        if (this._request?.headers) {
            const ip = this.getIpAndCoordinate();
            data.creationIp = ip;
        }
        data.idCreationUser = user
            ? Number(user.userId)
            : !this._request
              ? null
              : this._request.user
                ? +this._request.user['userId']
                : null;

        data.status = extraData?.status || data.status || StatusEnum.ACTIVE;
        return this.cleanObjects(
            await this.repository.save(this.cleanDataBeforeInsert(data), {
                data: extraData ? { ...user, extraData } : user,
            })
        );
    }

    protected async activateEntityByStatus(
        entity: Entity | Entity[],
        user: IUserReq
    ): Promise<any> {
        return this.updateEntity({ status: StatusEnum.ACTIVE }, entity, user);
    }

    protected arrayEquals(a: [], b: []) {
        return _.isEqual(a.sort(), b.sort());
    }

    protected cleanObjects(data: Entity): Entity {
        delete data.creationDate;
        delete data.creationUser;
        delete data.modificationDate;
        delete data.modificationUser;
        delete data.creationIp;
        delete data.modificationIp;
        return data;
    }

    protected createQueryBuilder(
        alias?: string,
        queryRunner?: QueryRunner
    ): SelectQueryBuilder<Entity> {
        if (queryRunner) {
            return this.repository.createQueryBuilder(alias, queryRunner);
        }

        if (alias) {
            return this.repository.createQueryBuilder(alias);
        }

        return this.repository.createQueryBuilder();
    }

    protected async cancelEntityByStatus(entity: Entity | Entity[], user: IUserReq): Promise<any> {
        return this.updateEntity({ status: StatusEnum.CANCELLED }, entity, user);
    }

    protected async deleteEntity(entities: Entity | Entity[], options?: RemoveOptions) {
        if (entities instanceof Array) {
            return await this.repository.remove(entities, options);
        }
        return await this.repository.remove(entities, options);
    }

    protected async deleteEntityByStatus(entity: Entity | Entity[], user: IUserReq): Promise<any> {
        return this.updateEntity({ status: StatusEnum.DELETED }, entity, user);
    }

    protected async disableEntityByStatus(entity: Entity | Entity[], user: IUserReq): Promise<any> {
        return this.updateEntity({ status: StatusEnum.INACTIVE }, entity, user);
    }

    protected async orderBy(
        data: any[],
        key: any[] | Function | object[] | string[],
        order: 'asc' | 'desc'
    ) {
        return _.orderBy(data, key, [order]);
    }

    protected paginateForInfiniteScroll(entity: any[], page: number): IInfiniteScroll {
        return {
            items: [...entity],
            itemCount: entity.length,
            totalItems: entity.length,
            pageCount: page,
            next: '',
            last: '',
        };
    }

    protected query(query: string, parameters?: any[]): Promise<any> {
        if (parameters) {
            return this.repository.query(query, parameters);
        }
        return this.repository.query(query);
    }

    protected async updateEntity(
        data: any,
        entity: Entity | Entity[],
        user?: IUserReq
    ): Promise<any> {
        if (this._request !== undefined) {
            const ip = this.getIpAndCoordinate();
            data.modificationIp = ip;
        }
        data.modificationUser = user
            ? Number(user.userId)
            : !this._request
              ? null
              : this._request.user
                ? +this._request.user['userId']
                : null;
        data.modificationDate = new Date();
        data = this.cleanDataBeforeInsert(data);

        if (entity instanceof Array) {
            for (const deepEntity of entity) {
                this.repository.merge(deepEntity, data);
            }
            const entities = await this.repository.save(entity, { data: user });
            entities.forEach((element) => {
                this.cleanObjects(element);
            });
            return entities;
        }

        this.repository.merge(this.cleanDataBeforeInsert(entity), data);
        return this.cleanObjects(await this.repository.save(entity, { data: user }));
    }

    private cleanDataBeforeInsert(data: any): any {
        for (const key in data) {
            if (data[key] && typeof data[key] === 'object' && Object.keys(data[key]).length === 2) {
                if (!isNaN(data[key]['longitude']) && !isNaN(data[key]['latitude'])) {
                    data[key] = `${data[key]['latitude']},${data[key]['longitude']}`;
                } else if (!isNaN(data[key]['x']) && !isNaN(data[key]['y'])) {
                    data[key] = `${data[key]['x']},${data[key]['y']}`;
                }
            }
        }

        return data;
    }

    private getIpAndCoordinate(): string | null {
        if (!this._request || !this._request.headers) return null
        const forwarded = this._request.headers['x-forwarded-for'];
        return forwarded ? forwarded.toString() : null;
    }
}