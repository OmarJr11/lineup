import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEntityUserSearches1773400000000 implements MigrationInterface {
    name = 'CreateEntityUserSearches1773400000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "system"."user_searches" (
                "creation_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "modification_date" TIMESTAMP WITH TIME ZONE DEFAULT now(),
                "creation_ip" character varying(50),
                "modification_ip" character varying(50),
                "creation_coordinate" point,
                "modification_coordinate" point,
                "id" BIGSERIAL NOT NULL,
                "id_creation_user" bigint NOT NULL,
                "search_term" character varying(255) NOT NULL,
                CONSTRAINT "PK_user_searches" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "system"."user_searches"
            ADD CONSTRAINT "FK_user_searches_id_creation_user"
            FOREIGN KEY ("id_creation_user") REFERENCES "system"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_user_searches_id_creation_user"
            ON "system"."user_searches" ("id_creation_user")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "system"."IDX_user_searches_id_creation_user"`);
        await queryRunner.query(
            `ALTER TABLE "system"."user_searches" DROP CONSTRAINT "FK_user_searches_id_creation_user"`
        );
        await queryRunner.query(`DROP TABLE "system"."user_searches"`);
    }
}
