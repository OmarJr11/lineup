import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LogWarn } from '../helpers/logger.helper';
import { RolesService } from '../../modules/roles/roles.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
    private readonly logger = new Logger(PermissionsGuard.name);
    constructor(
        private _reflector: Reflector,
        private readonly _rolesService: RolesService
    ) { }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const permissions: string[] = this._reflector
            .get<string[]>('permissions', context.getHandler());
        if (!permissions) return true;
        const response = this._reflector
            .get<[{}]>('response', context.getHandler());
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        return this.checkPermission(Number(user.userId), permissions, response);
    }

    /**
     * Check if user has certain permissions in the system
     *
     * @param {IUserReq} idUser - id of the user to verify permissions
     * @param {string[]} permissions - permissions code to verify
     * @param {[{}]} response - response to retrieve in case of error
     * @returns {Promise<boolean>}
     */
    async checkPermission(idUser: number, permissions: string[], response: [{}]): Promise<boolean> {
        if (!(await this._rolesService.userHasPermission(idUser, permissions))) {
            LogWarn(
                this.logger,
                'user has no permission to perform this request',
                this.checkPermission.name
            );
            throw new ForbiddenException(response[0]['noPermission']);
        }
        return true;
    }
}
