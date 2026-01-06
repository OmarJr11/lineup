import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSocialNetworks1767656924928 implements MigrationInterface {
    name = 'AddSocialNetworks1767656924928'

    public async up(queryRunner: QueryRunner): Promise<void> { 
        // Insert files data
        await queryRunner.query(`
            INSERT INTO "system"."files" (name, extension, directory, url, id_creation_user)
            VALUES 
                ('z17lBYDPITUGmnsVInmGFcuewpcfb9JzsKZxWgMpH4emhujyLe', 'png', 'public/social-networks', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/social-networks/z17lBYDPITUGmnsVInmGFcuewpcfb9JzsKZxWgMpH4emhujyLe', 1),
                ('cpeLzfP9dqrIAgydEANv8oTEgzFDDrYOQkSWYk8dzXdjaIUKXe', 'png', 'public/social-networks', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/social-networks/cpeLzfP9dqrIAgydEANv8oTEgzFDDrYOQkSWYk8dzXdjaIUKXe', 1),
                ('cyKjKj2FJJ8tiQbqPPSKz5aaHjsxrd8pZYX16Bj693WOnW7TBm', 'png', 'public/social-networks', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/social-networks/cyKjKj2FJJ8tiQbqPPSKz5aaHjsxrd8pZYX16Bj693WOnW7TBm', 1),
                ('VNNpRrIhfLIgbsSksH6IpkqGEhdn1IiprHFZoKkk4Ry9wFO6wK', 'png', 'public/social-networks', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/social-networks/VNNpRrIhfLIgbsSksH6IpkqGEhdn1IiprHFZoKkk4Ry9wFO6wK', 1),
                ('dJVYBdZLUQC0373cojW99gvqLyl9a9adIKPctOOt2ERS3SFUmu', 'png', 'public/social-networks', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/social-networks/dJVYBdZLUQC0373cojW99gvqLyl9a9adIKPctOOt2ERS3SFUmu', 1)
        `);
        // Insert social networks data
        await queryRunner.query(`
            INSERT INTO "system"."social_networks" (name, code, image_code, id_creation_user)
            VALUES 
                ('Facebook', 'facebook'::"system"."social_networks_code_enum", 'z17lBYDPITUGmnsVInmGFcuewpcfb9JzsKZxWgMpH4emhujyLe', 1),
                ('Instagram', 'instagram'::"system"."social_networks_code_enum", 'cpeLzfP9dqrIAgydEANv8oTEgzFDDrYOQkSWYk8dzXdjaIUKXe', 1),
                ('YouTube', 'youtube'::"system"."social_networks_code_enum", 'cyKjKj2FJJ8tiQbqPPSKz5aaHjsxrd8pZYX16Bj693WOnW7TBm', 1),
                ('WhatsApp', 'whatsapp'::"system"."social_networks_code_enum", 'VNNpRrIhfLIgbsSksH6IpkqGEhdn1IiprHFZoKkk4Ry9wFO6wK', 1),
                ('Telegram', 'telegram'::"system"."social_networks_code_enum", 'dJVYBdZLUQC0373cojW99gvqLyl9a9adIKPctOOt2ERS3SFUmu', 1)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "system"."social_networks"
            WHERE code IN (
                'facebook', 'instagram', 'youtube', 'whatsapp', 'telegram'
            )
        `);
        await queryRunner.query(`
            DELETE FROM "system"."files"
            WHERE name IN (
                'z17lBYDPITUGmnsVInmGFcuewpcfb9JzsKZxWgMpH4emhujyLe', 'cpeLzfP9dqrIAgydEANv8oTEgzFDDrYOQkSWYk8dzXdjaIUKXe', 'cyKjKj2FJJ8tiQbqPPSKz5aaHjsxrd8pZYX16Bj693WOnW7TBm', 'VNNpRrIhfLIgbsSksH6IpkqGEhdn1IiprHFZoKkk4Ry9wFO6wK', 'dJVYBdZLUQC0373cojW99gvqLyl9a9adIKPctOOt2ERS3SFUmu'
            )
        `);
    }

}
