import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRelationFilesToCategory1766968391996 implements MigrationInterface {
    name = 'AddRelationFilesToCategory1766968391996'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "catalogs" ADD "image_code" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "catalogs" ADD "tags" text array`);
        await queryRunner.query(`ALTER TABLE "catalogs" ADD CONSTRAINT "FK_bc4416f0b842b5bd657c166d827" FOREIGN KEY ("image_code") REFERENCES "system"."files"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "catalogs" DROP CONSTRAINT "FK_bc4416f0b842b5bd657c166d827"`);
        await queryRunner.query(`ALTER TABLE "catalogs" DROP COLUMN "tags"`);
        await queryRunner.query(`ALTER TABLE "catalogs" DROP COLUMN "image_code"`);
    }

}
