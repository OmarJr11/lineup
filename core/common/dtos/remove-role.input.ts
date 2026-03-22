import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

/**
 * Input for removing a role from a user.
 */
@InputType()
export class RemoveRoleFromUserInput {
  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  idUser: number;

  @Field(() => Int)
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt()
  idRole: number;
}
