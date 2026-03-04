import {
    Resolver,
    Query,
    Mutation,
    Args,
    Int,
} from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { RoleSchema } from '../../../../core/schemas';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { Permissions, Response, UserDec } from '../../../../core/common/decorators';
import {
    userRolesResponses,
    businessRolesResponses,
    roleResponses,
} from '../../../../core/common/responses';
import {
    UsersPermissionsEnum,
    BusinessesPermissionsEnum,
} from '../../../../core/common/enums';
import { IUserReq } from '../../../../core/common/interfaces';
import { UserRolesService } from '../../../../core/modules/user-roles/user-roles.service';
import { BusinessRolesService } from '../../../../core/modules/business-roles/business-roles.service';
import { RolesService } from '../../../../core/modules/roles/roles.service';
import { UsersGettersService } from '../../../../core/modules/users/users.getters.service';
import { BusinessesGettersService } from '../../../../core/modules/businesses/businesses-getters.service';
import { toRoleSchema } from '../../../../core/common/functions';
import {
    AssignRoleToUserInput,
    AssignRoleToBusinessInput,
    RemoveRoleFromUserInput,
    RemoveRoleFromBusinessInput,
} from '../../../../core/common/dtos';

/**
 * Resolver for admin role management.
 * Allows assigning and removing roles from users and businesses.
 */
@UsePipes(new ValidationPipe())
@Resolver(() => RoleSchema)
export class RolesAdminResolver {
    constructor(
        private readonly userRolesService: UserRolesService,
        private readonly businessRolesService: BusinessRolesService,
        private readonly rolesService: RolesService,
        private readonly usersGettersService: UsersGettersService,
        private readonly businessesGettersService: BusinessesGettersService,
    ) {}

    @Mutation(() => RoleSchema, { name: 'assignRoleToUser' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(UsersPermissionsEnum.USRUPDALL)
    @Response(userRolesResponses.create)
    async assignRoleToUser(
        @Args('data') data: AssignRoleToUserInput,
        @UserDec() admin: IUserReq,
    ): Promise<RoleSchema> {
        await this.usersGettersService.findOne(data.idUser);
        await this.rolesService.findOneOrFail(data.idRole);
        await this.userRolesService.create(data.idUser, data.idRole, admin);
        const role = await this.rolesService.findOneOrFail(data.idRole);
        return toRoleSchema(role);
    }

    @Mutation(() => RoleSchema, { name: 'assignRoleToBusiness' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(BusinessesPermissionsEnum.BURUPDALL)
    @Response(businessRolesResponses.create)
    async assignRoleToBusiness(
        @Args('data') data: AssignRoleToBusinessInput,
        @UserDec() admin: IUserReq,
    ): Promise<RoleSchema> {
        await this.businessesGettersService.findOne(data.idBusiness);
        await this.rolesService.findOneOrFail(data.idRole);
        await this.businessRolesService.create(data.idBusiness, data.idRole, admin);
        const role = await this.rolesService.findOneOrFail(data.idRole);
        return toRoleSchema(role);
    }

    @Mutation(() => Boolean, { name: 'removeRoleFromUser' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(UsersPermissionsEnum.USRUPDALL)
    @Response(userRolesResponses.delete)
    async removeRoleFromUser(
        @Args('data') data: RemoveRoleFromUserInput,
        @UserDec() admin: IUserReq,
    ): Promise<boolean> {
        await this.usersGettersService.findOne(data.idUser);
        await this.rolesService.findOneOrFail(data.idRole);
        await this.userRolesService.removeUserRole(data.idUser, data.idRole, admin);
        return true;
    }

    @Mutation(() => Boolean, { name: 'removeRoleFromBusiness' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(BusinessesPermissionsEnum.BURUPDALL)
    @Response(businessRolesResponses.delete)
    async removeRoleFromBusiness(
        @Args('data') data: RemoveRoleFromBusinessInput,
        @UserDec() admin: IUserReq,
    ): Promise<boolean> {
        await this.businessesGettersService.findOne(data.idBusiness);
        await this.rolesService.findOneOrFail(data.idRole);
        await this.businessRolesService.removeBusinessRole(data.idBusiness, data.idRole, admin);
        return true;
    }

    @Query(() => [RoleSchema], { name: 'getAllRoles' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(UsersPermissionsEnum.USRLISALL)
    @Response(roleResponses.list)
    async getAllRoles(): Promise<RoleSchema[]> {
        const roles = await this.rolesService.getAll();
        return roles.map(toRoleSchema);
    }

    @Query(() => [RoleSchema], { name: 'getRolesByUser' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(UsersPermissionsEnum.USRLISALL)
    @Response(userRolesResponses.list)
    async getRolesByUser(
        @Args('idUser', { type: () => Int }) idUser: number,
    ): Promise<RoleSchema[]> {
        await this.usersGettersService.findOne(idUser);
        const userRoles = await this.userRolesService.findAllByUserId(idUser);
        return userRoles.map((ur) => toRoleSchema(ur.role));
    }

    @Query(() => [RoleSchema], { name: 'getRolesByBusiness' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(BusinessesPermissionsEnum.BURLISALL)
    @Response(businessRolesResponses.list)
    async getRolesByBusiness(
        @Args('idBusiness', { type: () => Int }) idBusiness: number,
    ): Promise<RoleSchema[]> {
        await this.businessesGettersService.findOne(idBusiness);
        const businessRoles = await this.businessRolesService
            .findAllByBusinessId(idBusiness);
        return businessRoles.map((br) => toRoleSchema(br.role));
    }
}
