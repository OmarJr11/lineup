import { Module } from '@nestjs/common';
import { RolesAdminResolver } from './roles-admin.resolver';
import { UserRolesModule } from '../../../../core/modules/user-roles/user-roles.module';
import { BusinessRolesModule } from '../../../../core/modules/business-roles/business-roles.module';
import { RolesModule } from '../../../../core/modules/roles/roles.module';
import { UsersModule } from '../../../../core/modules/users/users.module';
import { BusinessesModule } from '../../../../core/modules/businesses/businesses.module';
import { TokensModule } from '../../../../core/modules/token/token.module';

/**
 * Admin module for role management.
 * Allows assigning and removing roles from users and businesses.
 */
@Module({
    imports: [
        UserRolesModule,
        BusinessRolesModule,
        RolesModule,
        UsersModule,
        BusinessesModule,
        RolesModule,
        TokensModule
    ],
    providers: [RolesAdminResolver],
})
export class RolesAdminModule {}
