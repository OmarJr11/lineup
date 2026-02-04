import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, IsUrl } from 'class-validator';

@InputType()
export class CreateSocialNetworkBusinessInput {
    @Field(() => Int)
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    idSocialNetwork: number;

    @Field()
    @IsNotEmpty()
    @IsString()
    @IsUrl()
    url: string;
}
