import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneToSocialNetworkBusinesses1770500000000 implements MigrationInterface {
    name = 'AddPhoneToSocialNetworkBusinesses1770500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "social_network_businesses" ADD COLUMN "phone" text`
        );
        await queryRunner.query(
            `ALTER TABLE "social_network_businesses" ALTER COLUMN "url" DROP NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "social_network_businesses" ADD CONSTRAINT "CHK_social_network_business_url_or_phone" CHECK (("url" IS NOT NULL AND "url" <> '') OR ("phone" IS NOT NULL AND "phone" <> ''))`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "social_network_businesses" DROP CONSTRAINT "CHK_social_network_business_url_or_phone"`
        );
        await queryRunner.query(
            `ALTER TABLE "social_network_businesses" ALTER COLUMN "url" SET NOT NULL`
        );
        await queryRunner.query(
            `ALTER TABLE "social_network_businesses" DROP COLUMN "phone"`
        );
    }
}
