import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { Pagination, paginate } from 'nestjs-typeorm-paginate';
import {
    EntityManager,
    FindOneOptions,
    In,
    Not,
    ObjectLiteral,
    QueryRunner,
    RemoveOptions,
    Repository,
    SelectQueryBuilder,
} from 'typeorm';
import { getEntityManagerOrTransactionManager } from 'typeorm-transactional-cls-hooked';
import { IBusinessReq, ILogin, ILoginReturn, IUserOrBusinessReq } from '../interfaces';
import { StatusEnum, OrderEnum } from '../enums';
import { invalidReferersRequest } from '../helpers/requests.helper';
import {
    ICoordinate,
    IExtraDataToSave,
    IInfiniteScroll,
    IPaginationOptions,
    IReqWithCookies,
    IUserReq,
} from '../interfaces';
import { getCoordinateFromObject } from '../libs/pyn-pon-coordinates.lib';
import _ = require('lodash');

export class BasicService<Entity extends ObjectLiteral> {
    private _connectionName = 'default';
    private defaultImages = [
        'default-avatar-01',
        'default-avatar-02',
        'default-avatar-03',
        'default-avatar-04',
        'default-avatar-05',
        'default-avatar-06',
        'default-avatar-07',
        'default-avatar-08',
        'default-avatar-09',
        'default-avatar-10',
    ];
    private _manager: EntityManager | undefined;

    constructor(
        private readonly repository: Repository<Entity>,
        private readonly _request?: Request
    ) { }

    /**
     * Find all matches entities
     *
     * @param {*} conditions - conditions to find
     */
    async find(conditions: any) {
        return await this.repository.find(conditions);
    }

    /**
     * Finds entities by ids. Optionally find options can be applied.
     *
     * @param {*} ids
     * @param {*} [options]
     */
    async findByIds(ids: any[], options?: any) {
        options.where.id = In(ids);

        return await this.repository.find(options);
    }

    /**
     * Find Entity by id without its relations
     *
     * @param {number} id - id of the entity to find
     * @param {*} error - forbidden error
     * @returns {Promise<Entity>}
     */
    async findByIdWithoutRelationsOrFail(id: number, error: any): Promise<Entity> {
        return await this.findOneOrFail(id, {
            where: { status: Not(StatusEnum.DELETED) },
        }).catch(() => {
            throw new ForbiddenException(error);
        });
    }

    /**
     * Finds first entity that matches given options.
     *
     * @param {(string|number|Date)} id
     * @param {*} [options]
     * @returns {Promise<Entity>}
     */
    async findOneOrFail(id: string | number | Date, options?: any): Promise<Entity> {
        if (!id) {
            throw new NotFoundException({
                status: false,
                message: 'The id cant be empty',
                code: 5,
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

    /**
     * Find one entity that matches with options
     *
     * @param {FindOneOptions} options - Options to find
     * @returns {(Promise<Entity[]> | undefined)}
     */
    findOneWithOptions(options: FindOneOptions<Entity>): Promise<Entity | undefined> {
        return this.repository.findOne(options);
    }

    /**
     * Find one entity that matches with options
     *
     * @param {FindOneOptions<Entity>} options - Options to find
     * @returns {(Promise<Entity[]> | undefined)}
     */
    findOneWithOptionsOrFail(options: FindOneOptions<Entity>): Promise<Entity | undefined> {
        return this.repository.findOneOrFail(options);
    }

    /**
     * Finds entities that match given options.
     *
     * @param {FindOneOptions<Entity>} options - Defines a special criteria to find
     * specific entities.
     * @returns {(Promise<Entity[]>)}
     */
    async findWithOptionsOrFail(options: FindOneOptions<Entity>): Promise<Entity[]> {
        const result = await this.repository.find(options);

        if (result.length === 0) {
            throw new NotFoundException({
                status: false,
                message: 'No results to this query',
                code: 4,
            });
        }

        result.forEach((e) => {
            this.cleanObjects(e);
        });

        return result;
    }

    /**
     * Find all entities
     */
    async getAll() {
        return await this.repository.find();
    }

    /**
     *  Always get the entityManager from the cls namespace if active,
     *  otherwise, use the original or getManager(connectionName)
     *
     *  @returns {EntityManager}
     */
    get manager(): EntityManager {
        return getEntityManagerOrTransactionManager(this._connectionName, this._manager);
    }

    /**
     * @param {EntityManager} manager
     */
    set manager(manager: EntityManager) {
        this._manager = manager;
        this._connectionName = manager.connection.name;
    }

    /**
     * Saves a given entity in the database.
     * If entity does not exist in the database then inserts.
     *
     * @param {*} data -: Data required to create the entity
     * @param {IUserReq} [user] - User who executed the action
     * @param {IExtraDataToSave} [extraData] - Extra data to save
     */
    async save(data: any, userOrBusiness?: IUserOrBusinessReq, extraData?: IExtraDataToSave) {
        if (this._request?.headers) {
            const { ip, coordinate } = this.getIpAndCoordinate();
            data.creationIp = ip;
            data.creationCoordinate = coordinate;
        }
        if(userOrBusiness && userOrBusiness.userId) {
            data.creationUser = userOrBusiness
                ? Number(userOrBusiness.userId)
                : !this._request
                    ? null
                    : this._request.user
                        ? +this._request.user['userId']
                        : null;
            data.idCreationUser = userOrBusiness
                ? Number(userOrBusiness.userId)
                : !this._request
                    ? null
                    : this._request.user
                        ? +this._request.user['userId']
                        : null;
        } else {
            data.creationBusiness = userOrBusiness
                ? Number(userOrBusiness.businessId)
                : !this._request
                    ? null
                    : this._request.user
                        ? +this._request.user['businessId']
                        : null;
            data.idCreationBusiness = userOrBusiness
                ? Number(userOrBusiness.businessId)
                : !this._request
                    ? null
                    : this._request.user
                        ? +this._request.user['businessId']
                        : null;
        }

        data.status = extraData?.status || data.status || StatusEnum.ACTIVE;
        return this.cleanObjects(
            await this.repository.save(this.cleanDataBeforeInsert(data), {
                data: extraData ? { ...userOrBusiness, extraData } : userOrBusiness,
            })
        );
    }

    /**
     * Saves a given entity in the database.
     * If entity does not exist in the database then inserts and get the relations.
     *
     * @param {*} data - Data to save
     * @param {IUserReq} user - Logged user
     * @param {string[]} relations - Relations to find
     * @param {string} [status] - status to set
     * @returns {Promise<Entity>} the entity created with the relations
     */
    async saveAndGetRelations(
        data: any,
        user: IUserOrBusinessReq,
        relations: string[],
        status?: string
    ): Promise<Entity> {
        const { ip, coordinate } = this.getIpAndCoordinate();
        data.creationUser = user
            ? Number(user.userId)
            : !this._request
                ? null
                : this._request.user
                    ? +this._request.user['userId']
                    : null;
        data.idCreationUser = user
            ? Number(user.userId)
            : !this._request
                ? null
                : this._request.user
                    ? +this._request.user['userId']
                    : null;
        data.status = status ? status : StatusEnum.ACTIVE;

        data.creationIp = ip;
        data.creationCoordinate = coordinate;

        const savedEntity = await this.repository.save(this.cleanDataBeforeInsert(data), {
            data: user,
        });

        return this.cleanObjects(
            await this.repository.findOne({
                where: { id: savedEntity.id },
                relations,
            })
        );
    }

    /**
     * Activate the entity
     *
     * @param {(Entity|Entity[])} entity - Entity to update
     * @param {IUserReq} user - User who executed the action
     * @returns {Promise<any>}
     */
    protected async activateEntity(entity: Entity | Entity[], user: IUserOrBusinessReq): Promise<any> {
        return this.updateEntity({ disabled: false }, entity, user);
    }

    /**
     * Activate the entity by field status
     * @param {(Entity|Entity[])} entity - Entity to update
     * @param {IUserReq} user - User who executed the action
     * @returns {Promise<any>}
     */
    protected async activateEntityByStatus(
        entity: Entity | Entity[],
        user: IUserOrBusinessReq
    ): Promise<any> {
        return this.updateEntity({ status: StatusEnum.ACTIVE }, entity, user);
    }

    /**
     *  Check if two arrays are equals
     *
     * @param {Array} [a=[]]
     * @param {Array} [b=[]]
     */
    protected arrayEquals(a: [], b: []) {
        return _.isEqual(a.sort(), b.sort());
    }

    /**
     * Delete unwanted properties for the entity
     *
     * @param {Entity} data
     * @returns {Entity}
     */
    protected cleanObjects(data: Entity): Entity {
        delete data.creationDate;
        delete data.creationUser;
        delete data.creationBusiness;
        delete data.creationCoordinate;
        delete data.modificationDate;
        delete data.modificationUser;
        delete data.modificationBusiness;
        delete data.modificationCoordinate;
        delete data.creationIp;
        delete data.modificationIp;
        return data;
    }

    /**
     * Delete unwanted properties for the entities
     *
     * @param {IPaginationOptions} options - Options to paginate
     * @param {SelectQueryBuilder<Entity>} query - Query without executing, just to paginate
     * @returns {Promise<Pagination<Entity>>}
     */
    protected async cleanResultPagination(
        options: IPaginationOptions,
        query: SelectQueryBuilder<Entity>
    ): Promise<Pagination<Entity>> {
        const tempResult = await paginate<Entity>(query, options);

        tempResult.items.map((e) => {
            return this.cleanObjects(e);
        });

        return tempResult;
    }

    /**
     * Creates a new query builder that can be used to build a sql query.
     *
     * @param {string} [alias] - Alias of the table to select
     * @param {QueryRunner} [queryRunner]
     * @returns {SelectQueryBuilder<Entity>}
     */
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

    /**
     * Remove the entity
     *
     * @param {(Entity|Entity[])} entities - entities o entity to remove
     * @param {RemoveOptions} [options] - options to remove
     */
    protected async deleteEntity(entities: Entity | Entity[], options?: RemoveOptions) {
        if (options) {
            if (entities instanceof Array) {
                return await this.repository.remove(entities, options);
            }

            return await this.repository.remove(entities, options);
        }

        if (entities instanceof Array) {
            return await this.repository.remove(entities, options);
        }

        return await this.repository.remove(entities, options);
    }

    /**
     * Delete the entity by field 'status'
     * @param {Entity | Entity[]} entity Entity to update
     * @param {IUserReq} user User who executed the action
     * @returns {Promise<any>}
     */
    protected async deleteEntityByStatus(entity: Entity | Entity[], user: IUserOrBusinessReq): Promise<any> {
        return this.updateEntity({ status: StatusEnum.DELETED }, entity, user);
    }

    /**
     *  Disabled the entity
     * @param {Entity | Entity[]} entity
     * @param {IUserReq} [user]
     * @returns {Promise<any>}
     */
    protected async disableEntity(entity: Entity | Entity[], userOrBusiness?: IUserOrBusinessReq): Promise<any> {
        return this.updateEntity({ disabled: true }, entity, userOrBusiness);
    }

    /**
     * Disabled the entity by field 'status'
     *
     * @param {Entity | Entity[]} entity Entity to update
     * @param {IUserReq} user User who executed the action
     * @returns {Promise<any>}
     */
    protected async disableEntityByStatus(entity: Entity | Entity[], user: IUserOrBusinessReq): Promise<any> {
        return this.updateEntity({ status: StatusEnum.INACTIVE }, entity, user);
    }

    /**
     *  Paginate a array.
     *
     * @param {IPaginationOptions} options - Options to paginate
     * @param {*} query - Array of result, results of a .query () or a simple array.
     */
    protected getPaginatedItems(options: IPaginationOptions, query: any[]) {
        if (+options.page <= 0) {
            options.page = 1;
        }

        const offset = (+options.page - 1) * +options.limit;
        const items = _.drop(query, offset).slice(0, +options.limit);

        return {
            items,
            itemCount: items.length,
            totalItems: query.length,
            totalPages: Math.ceil(query.length / +options.limit),
            pageCount: Math.ceil(items.length / +options.limit),
            next: '',
            last: '',
        };
    }

    /**
     * Randomly get the image for the avatar
     *
     * @param {string[]} [imagesAssigned] - array of images assigned
     * @returns {string}
     *
     */
    protected getRandomAvatar(imagesAssigned?: string[]): string {
        const avatars = [...this.defaultImages];

        if (imagesAssigned && imagesAssigned.length < avatars.length) {
            imagesAssigned.forEach((image) => {
                _.remove(avatars, (avatar) => avatar === image);
            });
        }

        return avatars[Math.ceil(Math.random() * 100) % avatars.length];
    }

    /**
     * GroupBy array method
     *
     * @param {*} array
     * @param {string} key
     */
    protected groupBy = (array: any[], key: string) => {
        return array.reduce((result, currentValue) => {
            // If an array already present for key, push it to the array. Else create an array
            // and push the object
            (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
            // Return the current iteration `result` value, this will be taken as next
            // iteration `result` value and accumulate
            return result;
        }, {}); // empty object is the initial value for result object
    };

    /**
     * Order array by key
     *
     * @param {*} data - Array to order
     * @param {* | Function | object[] | string[]} key - Key to order
     * @param {string} [order=asc|desc] - 'asc' | 'desc'
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    protected async orderBy(
        data: any[],
        key: any[] | Function | object[] | string[],
        order: 'asc' | 'desc'
    ) {
        return _.orderBy(data, key, [order]);
    }

    /**
     * Paginate the query results by params
     *
     * @param {IPaginationOptions} options - Options to paginate
     * @param {(SelectQueryBuilder<Entity> | *)} [query] - Query without executing, just to paginate
     * @returns {Promise<Pagination<Entity>>}
     */
    protected async paginate(
        options: IPaginationOptions,
        query?: SelectQueryBuilder<Entity> | any[]
    ) {
        options.page = options.page || 0;
        options.limit = options.limit || 10;
        options.limit = options.limit > 100 ? 100 : options.limit;

        if (options['order']) {
            switch (options['order'].toUpperCase()) {
                case 'ASC':
                    options['order'] = OrderEnum.ASC;
                    break;
                case 'DESC':
                    options['order'] = OrderEnum.DESC;
                    break;
                default:
                    delete options['order'];
            }
        }

        if (query instanceof SelectQueryBuilder) {
            if (options.where) {
                query.where(options.where);
            }

            if (options.orderBy) {
                query.orderBy(
                    `${query.expressionMap.mainAlias.name}.${options.orderBy}`,
                    options.order
                );
            }
            return await this.cleanResultPagination(options, query);
        }

        if (query instanceof Array) {
            if (options.where) {
                const auxWhere = {};

                options.where.forEach((e) => {
                    auxWhere[Object.keys(e)[0]] = Object.values(e)[0];
                });

                query = _.filter(query, auxWhere);
            }

            if (options.orderBy) {
                query = _.orderBy(
                    query,
                    [options.orderBy],
                    [options.order && options.order === 'DESC' ? 'desc' : 'asc']
                );
            }

            return this.getPaginatedItems(options, query);
        }

        const queryBuilder = this.repository.createQueryBuilder('T');
        queryBuilder.where(options.where);
        queryBuilder.orderBy(options.orderBy, options.order);

        return await this.cleanResultPagination(options, queryBuilder);
    }

    /**
     *  Always get the entityManager from the cls namespace if active,
     *  otherwise, use the original or getManager(connectionName)
     *
     *  @param {*} entity
     *  @param {number} page
     *  @returns {IInfiniteScroll}
     */
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

    /**
     * Execute a raw SQL query and returns a raw database results.
     *
     * @param {string} query - Query to execute.
     * @param {*} [parameters] - Query to execute.
     * @returns {Promise<any>}
     */
    protected query(query: string, parameters?: any[]): Promise<any> {
        if (parameters) {
            return this.repository.query(query, parameters);
        }
        return this.repository.query(query);
    }

    /**
     * set the default field of the image objects
     *
     * @param {*} image - image object
     */
    protected setDefaultColumnForImages(image: any) {
        const avatars = [...this.defaultImages];

        if (image) {
            if (avatars.find((element) => element === image['name'])) {
                image['default'] = true;
            } else {
                image['default'] = false;
            }
        }
    }

    /**
     * Update and get register with relations
     *
     * @param {*} data - Data to update
     * @param {Entity} entity - Entity to update
     * @param {IUserReq} user - Logged user
     * @param {string[]} relations - Array of relations
     */
    protected async updateAndGetRelations(
        data: any,
        entity: Entity,
        user: IUserOrBusinessReq,
        relations: string[]
    ) {
        const updatedEntity = await this.updateEntity(data, entity, user);
        return this.cleanObjects(
            await this.repository.findOne({
                where: { id: updatedEntity.id },
                relations,
            })
        );
    }

    /**
     *  Update the entity in the database
     *
     * @param {*} data - Data to update the entity
     * @param {(Entity|Entity[])} entity - Entity to update
     * @param {IUserReq} [user] - User who executed the action
     * @returns {Promise<any>} with the updated entity
     */
    protected async updateEntity(
        data: any,
        entity: Entity | Entity[],
        userOrBusiness?: IUserOrBusinessReq
    ): Promise<any> {
        if (this._request !== undefined) {
            const { ip, coordinate } = this.getIpAndCoordinate();
            data.modificationIp = ip;
            data.modificationCoordinate = coordinate;
        }

        if(userOrBusiness.userId) {
            data.modificationUser = userOrBusiness
                ? Number(userOrBusiness.userId)
                : !this._request
                    ? null
                    : this._request.user
                        ? +this._request.user['userId']
                        : null;
        } else {
            data.modificationBusiness = userOrBusiness
                ? Number(userOrBusiness.businessId)
                : !this._request
                    ? null
                    : this._request.user
                        ? +this._request.user['businessId']
                        : null;
        }
        data.modificationDate = new Date();
        data = this.cleanDataBeforeInsert(data);

        const entityColumns = this.repository.metadata.columns.map(col => col.propertyName);
        Object.keys(data).forEach(key => {
            if (!entityColumns.includes(key)) {
                delete data[key];
            }
        });


        if (entity instanceof Array) {
            for (const deepEntity of entity) {
                await this.repository.update(deepEntity.id, data);
            }
            const ids: Number[] = entity.map((e) => Number(e.id));
            const entities = await this.repository.find(
                { where: { id: In(ids) } as any }
            )
            entities.forEach((element) => {
                this.cleanObjects(element);
            });

            return entities;
        }

        await this.repository.update(entity.id, data);
        return this.cleanObjects(await this.repository.findOneOrFail({ where: { id: entity.id } as any }));
    }

    /**
     * Upsert, only works with postgres.
     *
     * @param {T} obj - Object to upsert
     * @param {string} primary_keys - Primary key to upsert
     * @param {{[add_upsert]:string},[do_not_upsert:string[]]} [opts] - Keys to exclude from upsert.
     * This is useful if a non-nullable field  is required in case the row does not already exist
     * but you do not want to overwrite this field if it already exists.
     * @returns {Promise<T>}
     */

    /**
     * Clean data to be able to save it in the database
     *
     * @param {*} data - Data to be cleaned
     * @returns {*} - Data cleaned
     */
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

    /**
     * Function to get the ip from the request and the coordinate
     * from the query params
     *
     * @returns {{ip: string, coordinate: CoordinateInterface}} - Ip and coordinate
     */
    private getIpAndCoordinate(): { ip: string; coordinate: ICoordinate } {
        const ip: string =
            this._request.headers && this._request.headers['x-forwarded-for']
                ? this._request.headers['x-forwarded-for'].toString()
                : null;
        const coordinate = this._request.query
            ? getCoordinateFromObject(this._request.query)
            : null;

        return { ip, coordinate };
    }
}
