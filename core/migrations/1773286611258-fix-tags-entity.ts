import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTagsEntity1773286611258 implements MigrationInterface {
    name = 'FixTagsEntity1773286611258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."states" DROP CONSTRAINT "FK_states_id_creation_user"`);
        await queryRunner.query(`ALTER TABLE "system"."states" DROP CONSTRAINT "FK_states_id_modification_user"`);
        await queryRunner.query(`ALTER TABLE "system"."users" DROP CONSTRAINT "FK_users_id_state"`);
        await queryRunner.query(`ALTER TABLE "product_tags" DROP CONSTRAINT "FK_product_tags_product"`);
        await queryRunner.query(`ALTER TABLE "product_tags" DROP CONSTRAINT "FK_product_tags_tag"`);
        await queryRunner.query(`ALTER TABLE "tags" ADD "id_creation_business" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "discounts" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`CREATE INDEX "IDX_e7fb050d8762f94c9c9b1c3c90" ON "product_tags" ("id_product") `);
        await queryRunner.query(`CREATE INDEX "IDX_7b3a8fb3b3a621fbfe93397bfd" ON "product_tags" ("id_tag") `);
        await queryRunner.query(`ALTER TABLE "tags" ADD CONSTRAINT "FK_425ac450d473c354c9538ae8d4a" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."states" ADD CONSTRAINT "FK_04cf2b205b52a2cf37e0ffe6106" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."states" ADD CONSTRAINT "FK_ac67f5a0c2724094f858c1bef52" FOREIGN KEY ("id_modification_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."users" ADD CONSTRAINT "FK_3da882e9fd07cd3129d70162533" FOREIGN KEY ("id_state") REFERENCES "system"."states"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_tags" ADD CONSTRAINT "FK_e7fb050d8762f94c9c9b1c3c904" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_tags" ADD CONSTRAINT "FK_7b3a8fb3b3a621fbfe93397bfdc" FOREIGN KEY ("id_tag") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_tags" DROP CONSTRAINT "FK_7b3a8fb3b3a621fbfe93397bfdc"`);
        await queryRunner.query(`ALTER TABLE "product_tags" DROP CONSTRAINT "FK_e7fb050d8762f94c9c9b1c3c904"`);
        await queryRunner.query(`ALTER TABLE "system"."users" DROP CONSTRAINT "FK_3da882e9fd07cd3129d70162533"`);
        await queryRunner.query(`ALTER TABLE "system"."states" DROP CONSTRAINT "FK_ac67f5a0c2724094f858c1bef52"`);
        await queryRunner.query(`ALTER TABLE "system"."states" DROP CONSTRAINT "FK_04cf2b205b52a2cf37e0ffe6106"`);
        await queryRunner.query(`ALTER TABLE "tags" DROP CONSTRAINT "FK_425ac450d473c354c9538ae8d4a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7b3a8fb3b3a621fbfe93397bfd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e7fb050d8762f94c9c9b1c3c90"`);
        await queryRunner.query(`ALTER TABLE "discounts" ALTER COLUMN "status" SET DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "tags" DROP COLUMN "id_creation_business"`);
        await queryRunner.query(`ALTER TABLE "product_tags" ADD CONSTRAINT "FK_product_tags_tag" FOREIGN KEY ("id_tag") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_tags" ADD CONSTRAINT "FK_product_tags_product" FOREIGN KEY ("id_product") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."users" ADD CONSTRAINT "FK_users_id_state" FOREIGN KEY ("id_state") REFERENCES "system"."states"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."states" ADD CONSTRAINT "FK_states_id_modification_user" FOREIGN KEY ("id_modification_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."states" ADD CONSTRAINT "FK_states_id_creation_user" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
