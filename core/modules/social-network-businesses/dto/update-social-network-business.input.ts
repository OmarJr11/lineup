import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

@InputType()
export class UpdateSocialNetworkBusinessInput {
    @Field(() => Int)
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    id: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    idSocialNetwork?: number;

    @Field({ nullable: true })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    @IsUrl()
    url?: string;
}
