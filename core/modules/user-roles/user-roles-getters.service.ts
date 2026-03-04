import {
    Injectable,
    Logger,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { BasicService } from '../../common/services';
  import { UserRole } from '../../entities';
  import { Repository } from 'typeorm';
  import { LogError } from '../../common/helpers/logger.helper';
  import { userRolesResponses } from '../../common/responses';
  
  @Injectable()
  export class UserRolesGettersService extends BasicService<UserRole> {
    private logger: Logger = new Logger(UserRolesGettersService.name);
    private readonly rList = userRolesResponses.list;
    private readonly _relations = ['role'];
  
    constructor(
      @InjectRepository(UserRole)
      private readonly userRoleRepository: Repository<UserRole>
    ) {
      super(userRoleRepository);
    }
  
    /**
     * Find a user role by user and role IDs
     * @param {number} idUser - The ID of the user
     * @param {number} idRole - The ID of the role
     */
    async findOne(idUser: number, idRole: number): Promise<UserRole | null> {
        const where = { idUser, idRole };
        const relations = this._relations;
        return await this.findOneWithOptions({ where, relations});
    }

    /**
     * Find a user role by user and role IDs or fail
     * @param {number} idUser - The ID of the user
     * @param {number} idRole - The ID of the role
     * @returns {Promise<UserRole>} The user role
     */
    async findOneOrFail(idUser: number, idRole: number): Promise<UserRole> {
        try {
            return await this.findOneWithOptionsOrFail({ 
                where: { idUser, idRole },
                relations: this._relations
            });
        } catch (error) {
            LogError(this.logger, error, this.findOneOrFail.name);
            throw new NotFoundException(this.rList.notFound);
        }
    }
  
    /**
     * Find all roles assigned to a user.
     * @param {number} idUser - The user ID.
     * @returns {Promise<UserRole[]>} User roles with role relation.
     */
    async findAllByUserId(idUser: number): Promise<UserRole[]> {
        try {
            return await this.find({
                where: { idUser },
                relations: this._relations
            });
        } catch (error) {
            LogError(this.logger, error, this.findAllByUserId.name);
            throw new NotFoundException(this.rList.error);
        }
    }
  }
  