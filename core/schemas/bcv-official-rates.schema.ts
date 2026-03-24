import { Field, Float, ObjectType } from '@nestjs/graphql';

/**
 * Official BCV USD/EUR reference snapshot stored in Redis (`bcv:official:snapshot`).
 */
@ObjectType()
export class BcvOfficialRatesSchema {
  @Field(() => Float, { nullable: true })
  dollar: number | null;

  @Field(() => Float, { nullable: true })
  euro: number | null;

  @Field(() => String, { nullable: true })
  sourceDate: string | null;
}
