import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSchemas1747706315422 implements MigrationInterface {
    name = 'CreateUsersTable1747706315422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS system`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP SCHEMA IF EXISTS system CASCADE`);
    }

}
