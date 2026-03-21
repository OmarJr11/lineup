import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RolePermission } from '../../entities';

/**
 * Singleton service for permission checks used by {@link PermissionsGuard}.
 * {@link RolesService} is request-scoped; injecting it into a singleton guard breaks under GraphQL (repository undefined).
 */
@Injectable()
export class RolesPermissionsCheckerService {
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(RolePermission)
        private readonly rolePermissionRepository: Repository<RolePermission>,
    ) {}

    /**
     * Check if the user has any of the given permission codes (via assigned roles).
     * @param {number} idUser - User ID.
     * @param {string[]} codes - Permission codes to check.
     * @returns {Promise<boolean>} True if the user has at least one of the permissions.
     */
    async userHasPermission(idUser: number, codes: string[]): Promise<boolean> {
        const roleIds = (
            await this.roleRepository
                .createQueryBuilder('R')
                .select(['R.id'])
                .innerJoin('R.userRoles', 'UR')
                .where('UR.idUser = :idUser', { idUser })
                .getMany()
        ).map((r) => r.id);
        return roleIds.length > 0 ? this.hasAnyPermission(roleIds, codes) : false;
    }

    /**
     * Check if the business has any of the given permission codes (via assigned roles).
     * @param {number} idBusiness - Business ID.
     * @param {string[]} codes - Permission codes to check.
     * @returns {Promise<boolean>} True if the business has at least one of the permissions.
     */
    async businessHasPermission(idBusiness: number, codes: string[]): Promise<boolean> {
        const roleIds = (
            await this.roleRepository
                .createQueryBuilder('R')
                .select(['R.id'])
                .innerJoin('R.businessRoles', 'BR')
                .where('BR.idBusiness = :idBusiness', { idBusiness })
                .getMany()
        ).map((r) => r.id);
        return roleIds.length > 0 ? this.hasAnyPermission(roleIds, codes) : false;
    }

    /**
     * Resolve permission codes for role IDs and check overlap with requested codes.
     * @param {number[]} roleIds - Role IDs.
     * @param {string[]} codes - Permission codes to match.
     * @returns {Promise<boolean>} True if any code is granted by any role.
     */
    private async hasAnyPermission(roleIds: number[], codes: string[]): Promise<boolean> {
        const allCodes = await this.getPermissionCodesForRoleIds(roleIds);
        return codes.some((code) => allCodes.includes(code));
    }

    /**
     * Load distinct permission codes linked to the given roles.
     * @param {number[]} roleIds - Role IDs.
     * @returns {Promise<string[]>} Permission codes.
     */
    private async getPermissionCodesForRoleIds(roleIds: number[]): Promise<string[]> {
        if (roleIds.length === 0) {
            return [];
        }
        const rows = await this.rolePermissionRepository
            .createQueryBuilder('rp')
            .innerJoin('rp.permission', 'p')
            .select('p.code', 'code')
            .where('rp.idRole IN (:...roleIds)', { roleIds })
            .getRawMany<{ code: string }>();
        return Array.from(new Set(rows.map((r) => r.code)));
    }
}
