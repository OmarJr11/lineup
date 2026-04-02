import { InputType, Field } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsArray,
  IsEmpty,
  Matches,
} from 'class-validator';

@InputType()
export class UpdateCatalogInput {
  @Field()
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  idCatalog: number;

  @Field()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imageCode?: string;

  @Field({
    nullable: true,
    description:
      'Accent color as #RRGGBB. Omit to keep current value; pass null to clear.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/, {
    message: 'hexColor must be # followed by exactly 6 hexadecimal digits',
  })
  hexColor?: string | null;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsEmpty()
  path?: string;
}
