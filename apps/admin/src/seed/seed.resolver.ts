import { Resolver, Mutation } from '@nestjs/graphql';
import { SeedService } from '../../../../core/modules/seed/seed.service';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Permissions } from '../../../../core/common/decorators';
import { SeedPermissionsEnum } from '../../../../core/common/enums';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { SEED_CATALOGS, SEED_BUSINESSES, SEED_PRODUCTS } from '../../../../core/modules/seed/data';

/**
 * Public resolver for seeding development data.
 * Mutations only work when NODE_ENV = 'development'.
 */
@UsePipes(new ValidationPipe())
@Resolver()
export class SeedResolver {
    constructor(private readonly seedService: SeedService) {}

    /**
     * Seeds businesses from hardcoded data.
     * Public mutation - no auth required. Only runs in development.
     */
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(SeedPermissionsEnum.SEEDBUS)
    @Mutation(() => Boolean, { name: 'seedDevelopmentBusinesses' })
    async seedDevelopmentBusinesses(): Promise<boolean> {
        for (const item of SEED_BUSINESSES) await this.seedService.seedOneBusiness(item);
        return true;
    }

    /**
     * Seeds catalogs from hardcoded data.
     * Public mutation - no auth required. Only runs in development.
     */
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(SeedPermissionsEnum.SEEDBUS)
    @Mutation(() => Boolean, { name: 'seedDevelopmentCatalogs' })
    async seedDevelopmentCatalogs(): Promise<boolean> {
        for (const item of SEED_CATALOGS) await this.seedService.seedOneCatalog(item);
        return true;
    }

    /**
     * Seeds products from hardcoded data.
     * Requires businesses and catalogs to be seeded first. Only runs in development.
     */
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(SeedPermissionsEnum.SEEDBUS)
    @Mutation(() => Boolean, { name: 'seedDevelopmentProducts' })
    async seedDevelopmentProducts(): Promise<boolean> {
        for (const item of SEED_PRODUCTS) await this.seedService.seedOneProduct(item);
        return true;
    }
}
