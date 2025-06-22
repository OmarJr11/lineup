import {
  Inject,
  Injectable,
  Logger,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BasicService } from '../../common/services';
import { RolePermission } from '../../entities';
import { Repository } from 'typeorm';
import { roleResponses } from '../../common/responses';

@Injectable({ scope: Scope.REQUEST })
export class RolePermissionsService extends BasicService<RolePermission> {
  private logger: Logger = new Logger(RolePermissionsService.name);
  private readonly rList = roleResponses.list;

  constructor(
    @Inject(REQUEST)
    private readonly userRequest: Request,
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepository: Repository<RolePermission>
  ) {
    super(rolePermissionsRepository, userRequest);
  }

  /**
   * Get all permission codes for a set of role IDs (without using SQL function)
   * @param {number[]} roleIds - Array of role IDs
   * @returns {Promise<string[]>} - Array of permission codes
   */
  async getRolesPermissionsCodes(roleIds: number[]): Promise<string[]> {
    const directPermissions = await this.createQueryBuilder('rp')
      .innerJoin('rp.permission', 'p')
      .select('p.code', 'code')
      .where('rp.idRole IN (:...roleIds)', { roleIds })
      .getRawMany();
    // Combine and return unique codes
    return Array.from(new Set([...directPermissions.map((p) => p.code)]));
  }
}
