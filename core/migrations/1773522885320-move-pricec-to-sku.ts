import type { MigrationInterface, QueryRunner } from 'typeorm';

export class MovePricecToSku1773522885320 implements MigrationInterface {
  name = 'MovePricecToSku1773522885320';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_4a098b475800a5c8586a173acc4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_tags" DROP CONSTRAINT "FK_7b3a8fb3b3a621fbfe93397bfdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_tags" DROP CONSTRAINT "FK_e7fb050d8762f94c9c9b1c3c904"`,
    );
    await queryRunner.query(
      `ALTER TABLE "system"."user_searches" DROP CONSTRAINT "FK_user_searches_id_creation_user"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e7fb050d8762f94c9c9b1c3c90"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_7b3a8fb3b3a621fbfe93397bfd"`,
    );
    await queryRunner.query(
      `DROP INDEX "system"."IDX_user_searches_id_creation_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "CHK_c63e6a2acc1f1e6484389ed4df"`,
    );
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "price"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "id_currency"`);
    await queryRunner.query(
      `ALTER TABLE "product_skus" ADD "id_currency" bigint`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" ADD CONSTRAINT "CHK_5831819b11d72bf6de08995ce2" CHECK ((price IS NULL AND id_currency IS NULL) OR (price IS NOT NULL AND id_currency IS NOT NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_tags" ADD CONSTRAINT "FK_e7fb050d8762f94c9c9b1c3c904" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_tags" ADD CONSTRAINT "FK_7b3a8fb3b3a621fbfe93397bfdc" FOREIGN KEY ("id_tag") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" ADD CONSTRAINT "FK_95c455d4e9699661fe7055cecb7" FOREIGN KEY ("id_currency") REFERENCES "currencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "system"."user_searches" ADD CONSTRAINT "FK_b3af52edb0523e1c30e906bce55" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "system"."user_searches" DROP CONSTRAINT "FK_b3af52edb0523e1c30e906bce55"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" DROP CONSTRAINT "FK_95c455d4e9699661fe7055cecb7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_tags" DROP CONSTRAINT "FK_7b3a8fb3b3a621fbfe93397bfdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_tags" DROP CONSTRAINT "FK_e7fb050d8762f94c9c9b1c3c904"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" DROP CONSTRAINT "CHK_5831819b11d72bf6de08995ce2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_skus" DROP COLUMN "id_currency"`,
    );
    await queryRunner.query(`ALTER TABLE "products" ADD "id_currency" bigint`);
    await queryRunner.query(`ALTER TABLE "products" ADD "price" numeric(10,2)`);
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "CHK_c63e6a2acc1f1e6484389ed4df" CHECK ((((price IS NULL) AND (id_currency IS NULL)) OR ((price IS NOT NULL) AND (id_currency IS NOT NULL))))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_searches_id_creation_user" ON "system"."user_searches" ("id_creation_user") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_7b3a8fb3b3a621fbfe93397bfd" ON "product_tags" ("id_tag") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e7fb050d8762f94c9c9b1c3c90" ON "product_tags" ("id_product") `,
    );
    await queryRunner.query(
      `ALTER TABLE "system"."user_searches" ADD CONSTRAINT "FK_user_searches_id_creation_user" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_tags" ADD CONSTRAINT "FK_e7fb050d8762f94c9c9b1c3c904" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_tags" ADD CONSTRAINT "FK_7b3a8fb3b3a621fbfe93397bfdc" FOREIGN KEY ("id_tag") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_4a098b475800a5c8586a173acc4" FOREIGN KEY ("id_currency") REFERENCES "currencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
