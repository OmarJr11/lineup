import { InputType, Field } from '@nestjs/graphql';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsArray,
  Matches,
} from 'class-validator';

@InputType()
export class CreateCatalogInput {
  @Field()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @IsString()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imageCode?: string;

  @Field({
    nullable: true,
    description:
      'Optional accent color as #RRGGBB (six hex digits after #). Omit to leave unset.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/, {
    message: 'hexColor must be # followed by exactly 6 hexadecimal digits',
  })
  hexColor?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  path?: string;
}
