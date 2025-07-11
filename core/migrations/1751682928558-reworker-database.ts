import { MigrationInterface, QueryRunner } from "typeorm";

export class ReworkerDatabase1751682928558 implements MigrationInterface {
    name = 'ReworkerDatabase1751682928558'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."businesses_provider_enum" AS ENUM('google', 'meta', 'apple', 'lineup', 'lineup_admin', 'lineup_app')`);
        await queryRunner.query(`CREATE TYPE "public"."businesses_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "businesses" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "email" character varying(50) NOT NULL, "email_validated" boolean NOT NULL, "provider" "public"."businesses_provider_enum" NOT NULL, "password" character varying(200) NOT NULL, "telephone" character varying(30), "name" character varying(100) NOT NULL, "description" character varying(255), "path" character varying(50) NOT NULL, "image_code" character varying(50) NOT NULL, "tags" text, "status" "public"."businesses_status_enum" NOT NULL DEFAULT 'active', CONSTRAINT "UQ_ee58c14c74529ea227d8337ab69" UNIQUE ("email"), CONSTRAINT "UQ_cf8dd9db884483735a05164503c" UNIQUE ("path"), CONSTRAINT "PK_bc1bf63498dd2368ce3dc8686e8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "system"."business_roles_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "system"."business_roles" ("id_business" bigint NOT NULL, "id_role" bigint NOT NULL, "status" "system"."business_roles_status_enum" NOT NULL DEFAULT 'active', "id_creation_business" bigint NOT NULL, CONSTRAINT "PK_85f53f59160618e6d86396aacac" PRIMARY KEY ("id_business", "id_role"))`);
        await queryRunner.query(`ALTER TABLE "system"."files" ADD "tags" text`);
        await queryRunner.query(`ALTER TYPE "system"."users_provider_enum" RENAME TO "users_provider_enum_old"`);
        await queryRunner.query(`CREATE TYPE "system"."users_provider_enum" AS ENUM('google', 'meta', 'apple', 'lineup', 'lineup_admin', 'lineup_app')`);
        await queryRunner.query(`ALTER TABLE "system"."users" ALTER COLUMN "provider" TYPE "system"."users_provider_enum" USING "provider"::"text"::"system"."users_provider_enum"`);
        await queryRunner.query(`DROP TYPE "system"."users_provider_enum_old"`);
        await queryRunner.query(`ALTER TYPE "system"."roles_code_enum" RENAME TO "roles_code_enum_old"`);
        await queryRunner.query(`CREATE TYPE "system"."roles_code_enum" AS ENUM('01ADMLUP', '02USERLUP', '03MODLUP', '05BUSSLUP', '06BUSADMLUP')`);
        await queryRunner.query(`ALTER TABLE "system"."roles" ALTER COLUMN "code" TYPE "system"."roles_code_enum" USING "code"::"text"::"system"."roles_code_enum"`);
        await queryRunner.query(`DROP TYPE "system"."roles_code_enum_old"`);
        await queryRunner.query(`ALTER TABLE "businesses" ADD CONSTRAINT "FK_1bf0d27f8f38a0cb04167adcc13" FOREIGN KEY ("image_code") REFERENCES "system"."files"("name") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" ADD CONSTRAINT "FK_aa859bf7eea4921f358647bdafa" FOREIGN KEY ("id_creation_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" ADD CONSTRAINT "FK_73f2557c9a0e7bc04d6e6c0cc90" FOREIGN KEY ("id_role") REFERENCES "system"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" ADD CONSTRAINT "FK_cac4e8b4b825c9ec56e9bfb866c" FOREIGN KEY ("id_business") REFERENCES "businesses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."business_roles" DROP CONSTRAINT "FK_cac4e8b4b825c9ec56e9bfb866c"`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" DROP CONSTRAINT "FK_73f2557c9a0e7bc04d6e6c0cc90"`);
        await queryRunner.query(`ALTER TABLE "system"."business_roles" DROP CONSTRAINT "FK_aa859bf7eea4921f358647bdafa"`);
        await queryRunner.query(`ALTER TABLE "businesses" DROP CONSTRAINT "FK_1bf0d27f8f38a0cb04167adcc13"`);
        await queryRunner.query(`CREATE TYPE "system"."roles_code_enum_old" AS ENUM('01ADMLUP', '02USERLUP', '03MODLUP', '05BUSSLUP')`);
        await queryRunner.query(`ALTER TABLE "system"."roles" ALTER COLUMN "code" TYPE "system"."roles_code_enum_old" USING "code"::"text"::"system"."roles_code_enum_old"`);
        await queryRunner.query(`DROP TYPE "system"."roles_code_enum"`);
        await queryRunner.query(`ALTER TYPE "system"."roles_code_enum_old" RENAME TO "roles_code_enum"`);
        await queryRunner.query(`CREATE TYPE "system"."users_provider_enum_old" AS ENUM('google', 'meta', 'apple', 'lineup', 'lineup_admin', 'lineup_app')`);
        await queryRunner.query(`ALTER TABLE "system"."users" ALTER COLUMN "provider" TYPE "system"."users_provider_enum_old" USING "provider"::"text"::"system"."users_provider_enum_old"`);
        await queryRunner.query(`DROP TYPE "system"."users_provider_enum"`);
        await queryRunner.query(`ALTER TYPE "system"."users_provider_enum_old" RENAME TO "users_provider_enum"`);
        await queryRunner.query(`ALTER TABLE "system"."files" DROP COLUMN "tags"`);
        await queryRunner.query(`DROP TABLE "system"."business_roles"`);
        await queryRunner.query(`DROP TYPE "system"."business_roles_status_enum"`);
        await queryRunner.query(`DROP TABLE "businesses"`);
        await queryRunner.query(`DROP TYPE "public"."businesses_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."businesses_provider_enum"`);
    }

}
