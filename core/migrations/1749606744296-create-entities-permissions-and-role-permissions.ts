import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntitiesPermissionsAndRolePermissions1749606744296 implements MigrationInterface {
    name = 'CreateEntitiesPermissionsAndRolePermissions1749606744296'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "system"."permissions_status_enum" AS ENUM('active', 'inactive', 'pending', 'suspended', 'deleted', 'completed', 'rejected', 'approved', 'failed', 'denied')`);
        await queryRunner.query(`CREATE TABLE "system"."permissions" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id" BIGSERIAL NOT NULL, "code" character varying NOT NULL, "description" character varying(100) NOT NULL, "status" "system"."permissions_status_enum" NOT NULL DEFAULT 'active', "id_creation_user" bigint NOT NULL, "id_modification_user" bigint, CONSTRAINT "UQ_8dad765629e83229da6feda1c1d" UNIQUE ("code"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "system"."role_permissions" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id_role" bigint NOT NULL, "id_permission" bigint NOT NULL, "id_creation_user" bigint NOT NULL, "id_modification_user" bigint, CONSTRAINT "PK_f1d50d1a08901894b08dfa94fb2" PRIMARY KEY ("id_role", "id_permission"))`);
        await queryRunner.query(`ALTER TABLE "system"."permissions" ADD CONSTRAINT "FK_9d3d2947e76075b380b9345a5c8" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."permissions" ADD CONSTRAINT "FK_a436dd95f35a4dcd51126fe0076" FOREIGN KEY ("id_modification_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."role_permissions" ADD CONSTRAINT "FK_2fd0662f45c87ced12c9c658d83" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."role_permissions" ADD CONSTRAINT "FK_192531b418f8abca789a3aebfc1" FOREIGN KEY ("id_modification_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."role_permissions" ADD CONSTRAINT "FK_c0f5917f07a9e2bfd31ac5fb154" FOREIGN KEY ("id_role") REFERENCES "system"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "system"."role_permissions" ADD CONSTRAINT "FK_5e7caee2bb7c1030ab07ad70ec2" FOREIGN KEY ("id_permission") REFERENCES "system"."permissions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."role_permissions" DROP CONSTRAINT "FK_5e7caee2bb7c1030ab07ad70ec2"`);
        await queryRunner.query(`ALTER TABLE "system"."role_permissions" DROP CONSTRAINT "FK_c0f5917f07a9e2bfd31ac5fb154"`);
        await queryRunner.query(`ALTER TABLE "system"."role_permissions" DROP CONSTRAINT "FK_192531b418f8abca789a3aebfc1"`);
        await queryRunner.query(`ALTER TABLE "system"."role_permissions" DROP CONSTRAINT "FK_2fd0662f45c87ced12c9c658d83"`);
        await queryRunner.query(`ALTER TABLE "system"."permissions" DROP CONSTRAINT "FK_a436dd95f35a4dcd51126fe0076"`);
        await queryRunner.query(`ALTER TABLE "system"."permissions" DROP CONSTRAINT "FK_9d3d2947e76075b380b9345a5c8"`);
        await queryRunner.query(`DROP TABLE "system"."role_permissions"`);
        await queryRunner.query(`DROP TABLE "system"."permissions"`);
        await queryRunner.query(`DROP TYPE "system"."permissions_status_enum"`);
    }

}
