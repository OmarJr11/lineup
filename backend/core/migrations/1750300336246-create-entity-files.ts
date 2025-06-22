import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateEntityFiles1750300336246 implements MigrationInterface {
    name = 'CreateEntityFiles1750300336246'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "system"."files" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "name" character varying(50) NOT NULL, "extension" character varying(10) NOT NULL, "directory" character varying(50) NOT NULL, "url" text NOT NULL, "id_creation_user" bigint NOT NULL, CONSTRAINT "PK_332d10755187ac3c580e21fbc02" PRIMARY KEY ("name"))`);
        await queryRunner.query(`ALTER TABLE "system"."files" ADD CONSTRAINT "FK_1f91992d190fce1d896458e2608" FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."files" DROP CONSTRAINT "FK_1f91992d190fce1d896458e2608"`);
        await queryRunner.query(`DROP TABLE "system"."files"`);
    }

}
