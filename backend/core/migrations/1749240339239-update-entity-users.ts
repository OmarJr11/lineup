import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEntityUsers1749240339239 implements MigrationInterface {
    name = 'UpdateEntityUsers1749240339239'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."users" DROP COLUMN "provider"`);
        await queryRunner.query(`CREATE TYPE "system"."users_provider_enum" AS ENUM('google', 'meta', 'apple', 'lineup', 'lineup_admin', 'lineup_app')`);
        await queryRunner.query(`ALTER TABLE "system"."users" ADD "provider" "system"."users_provider_enum" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."users" DROP COLUMN "provider"`);
        await queryRunner.query(`DROP TYPE "system"."users_provider_enum"`);
        await queryRunner.query(`ALTER TABLE "system"."users" ADD "provider" character varying(50) NOT NULL`);
    }

}
