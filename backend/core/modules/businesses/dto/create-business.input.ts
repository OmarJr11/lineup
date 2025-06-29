import { InputType, Field } from '@nestjs/graphql';
import { IsEmpty, IsNotEmpty } from 'class-validator';
import { IsOptional } from 'class-validator/types/decorator/common/IsOptional';
import { MaxLength } from 'class-validator/types/decorator/string/MaxLength';
import { IsString } from 'class-validator/types/decorator/typechecker/IsString';

@InputType()
export class CreateBusinessInput {
  @Field()
  @IsNotEmpty()
  @MaxLength(50)
  @IsString()
  email: string;

  @Field()
  @IsNotEmpty()
  @MaxLength(100)
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(255)
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(30)
  @IsString()
  telephone?: string;

  @Field({ nullable: true })
  @IsOptional()
  @MaxLength(50)
  @IsString()
  imageCode?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field({ nullable: true })
  @IsEmpty()
  path?: string;
}
