import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorCreateBusiness1762720687182 implements MigrationInterface {
    name = 'RefactorCreateBusiness1762720687182'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" DROP CONSTRAINT "FK_1bf0d27f8f38a0cb04167adcc13"`);
        await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "image_code" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD CONSTRAINT "FK_1bf0d27f8f38a0cb04167adcc13" FOREIGN KEY ("image_code") REFERENCES "system"."files"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "businesses" DROP CONSTRAINT "FK_1bf0d27f8f38a0cb04167adcc13"`);
        await queryRunner.query(`ALTER TABLE "businesses" ALTER COLUMN "image_code" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD CONSTRAINT "FK_1bf0d27f8f38a0cb04167adcc13" FOREIGN KEY ("image_code") REFERENCES "system"."files"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
