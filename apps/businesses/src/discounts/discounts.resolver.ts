import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateDiscountInput } from '../../../../core/modules/discounts/dto/create-discount.input';
import { FindDiscountsByScopeInput } from '../../../../core/modules/discounts/dto/find-discounts-by-scope.input';
import { UpdateDiscountInput } from '../../../../core/modules/discounts/dto/update-discount.input';
import { DiscountsService } from '../../../../core/modules/discounts/discounts.service';
import {
    EntityAuditSchema,
    DiscountSchema,
    PaginatedDiscounts,
} from '../../../../core/schemas';
import { InfinityScrollInput } from '../../../../core/common/dtos';
import { JwtAuthGuard, PermissionsGuard, TokenGuard } from '../../../../core/common/guards';
import { BusinessDec, Permissions, Response } from '../../../../core/common/decorators';
import { discountsResponses } from '../../../../core/common/responses';
import { DiscountsPermissionsEnum } from '../../../../core/common/enums';
import { IBusinessReq } from '../../../../core/common/interfaces';
import { toEntityAuditSchema, toDiscountSchema } from '../../../../core/common/functions';

/**
 * GraphQL resolver for discount operations.
 */
@UsePipes(new ValidationPipe())
@Resolver(() => DiscountSchema)
export class DiscountsResolver {
    constructor(private readonly discountsService: DiscountsService) {}

    @Mutation(() => DiscountSchema, { name: 'createDiscount' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(DiscountsPermissionsEnum.DISCCRE)
    @Response(discountsResponses.create)
    async create(
        @Args('data') data: CreateDiscountInput,
        @BusinessDec() businessReq: IBusinessReq,
    ) {
        return toDiscountSchema(await this.discountsService.create(data, businessReq));
    }

    @Mutation(() => DiscountSchema, { name: 'updateDiscount' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(DiscountsPermissionsEnum.DISCUPD)
    @Response(discountsResponses.update)
    async update(
        @Args('data') data: UpdateDiscountInput,
        @BusinessDec() businessReq: IBusinessReq,
    ) {
        return toDiscountSchema(await this.discountsService.update(data, businessReq));
    }

    @Mutation(() => Boolean, { name: 'removeDiscount' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(DiscountsPermissionsEnum.DISCDEL)
    @Response(discountsResponses.delete)
    async remove(
        @Args('id', { type: () => Int }) id: number,
        @BusinessDec() businessReq: IBusinessReq,
    ) {
        await this.discountsService.remove(id, businessReq);
        return true;
    }

    @Query(() => DiscountSchema, { name: 'findOneDiscount' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(DiscountsPermissionsEnum.DISCREAD)
    async findOne(
        @Args('id', { type: () => Int }) id: number,
        @BusinessDec() businessReq: IBusinessReq,
    ) {
        return toDiscountSchema(await this.discountsService.findOne(id, businessReq));
    }

    @Query(() => PaginatedDiscounts, { name: 'findAllMyDiscountsByScope' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(DiscountsPermissionsEnum.DISCREAD)
    async findAllMyDiscountsByScope(
        @Args('data') data: FindDiscountsByScopeInput,
        @Args('pagination', { type: () => InfinityScrollInput }) pagination: InfinityScrollInput,
        @BusinessDec() businessReq: IBusinessReq,
    ) {
        const result = await this.discountsService
            .findAllMyDiscountsByScope(data, pagination, businessReq);
        return {
            items: result.items.map(toDiscountSchema),
            total: result.total,
            page: result.page,
            limit: result.limit,
        };
    }

    @Query(() => DiscountSchema, { nullable: true, name: 'findActiveDiscountByProduct' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(DiscountsPermissionsEnum.DISCREAD)
    async findActiveDiscountByProduct(
        @Args('idProduct', { type: () => Int }) idProduct: number,
        @BusinessDec() businessReq: IBusinessReq,
    ) {
        const discount = await this.discountsService
            .findActiveDiscountByProduct(idProduct, businessReq);
        return discount ? toDiscountSchema(discount) : null;
    }

    @Query(() => [EntityAuditSchema], { name: 'findDiscountAuditByProduct' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(DiscountsPermissionsEnum.DISCREAD)
    async findAuditByProduct(
        @Args('idProduct', { type: () => Int }) idProduct: number,
        @BusinessDec() businessReq: IBusinessReq,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return (
            await this.discountsService
                .findAuditByProduct(idProduct, businessReq, limit ?? 50)
        ).map(toEntityAuditSchema);
    }

    @Query(() => [EntityAuditSchema], { name: 'findDiscountAuditByDiscount' })
    @UseGuards(JwtAuthGuard, TokenGuard, PermissionsGuard)
    @Permissions(DiscountsPermissionsEnum.DISCREAD)
    async findAuditByDiscount(
        @Args('idDiscount', { type: () => Int }) idDiscount: number,
        @BusinessDec() businessReq: IBusinessReq,
        @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    ) {
        return (
            await this.discountsService
                .findAuditByDiscount(idDiscount, businessReq, limit ?? 50)
        ).map(toEntityAuditSchema);
    }
}
