import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNameToLocations1772417527849 implements MigrationInterface {
    name = 'AddNameToLocations1772417527849'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" ADD "name" character varying(100) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "locations" ALTER COLUMN "name" DROP DEFAULT`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "locations" DROP COLUMN "name"`);
    }

}
