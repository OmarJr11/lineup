import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdStateToUsers1773000000000 implements MigrationInterface {
    name = 'AddIdStateToUsers1773000000000';

    /**
     * Adds id_state column to users table to associate a user with a state.
     */
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "system"."users" ADD "id_state" bigint`,
        );
        await queryRunner.query(
            `ALTER TABLE "system"."users" ADD CONSTRAINT "FK_users_id_state" FOREIGN KEY ("id_state") REFERENCES "system"."states"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "system"."users" DROP CONSTRAINT "FK_users_id_state"`,
        );
        await queryRunner.query(
            `ALTER TABLE "system"."users" DROP COLUMN "id_state"`,
        );
    }
}
