import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEntityTokens1749524019419 implements MigrationInterface {
    name = 'CreateEntityTokens1749524019419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "system"."tokens" ("creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(), "creation_ip" character varying(50), "modification_ip" character varying(50), "creation_coordinate" point, "modification_coordinate" point, "id_user" bigint NOT NULL, "token" character varying(400) NOT NULL, "refresh" character varying(400) NOT NULL, CONSTRAINT "PK_f605be7e1b82d9306600489d65c" PRIMARY KEY ("id_user", "token"))`);
        await queryRunner.query(`ALTER TABLE "system"."tokens" ADD CONSTRAINT "FK_39ec4c99950a8c64e84d4e96399" FOREIGN KEY ("id_user") REFERENCES "system"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "system"."tokens" DROP CONSTRAINT "FK_39ec4c99950a8c64e84d4e96399"`);
        await queryRunner.query(`DROP TABLE "system"."tokens"`);
    }

}
