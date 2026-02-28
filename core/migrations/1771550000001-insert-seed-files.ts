import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inserts seed file records for development/testing.
 */
export class InsertSeedFiles1771550000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "system"."files" ("name", "extension", "directory", "url", "id_creation_user")
            VALUES
                ('ljWl5sqiYYNb3bNw4BLXe46go81Gg4ctrM8PjGjBOlVqEf6AYr', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/ljWl5sqiYYNb3bNw4BLXe46go81Gg4ctrM8PjGjBOlVqEf6AYr', 1),
                ('T0fzJO7MKIaZwX3oIDqUdTuuRDYdmAZClGonLfczjAl1qKBcWw', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/T0fzJO7MKIaZwX3oIDqUdTuuRDYdmAZClGonLfczjAl1qKBcWw', 1),
                ('93YKYGralckcX2zPtumm4yYnvwIlA8PswQCy06OLCjgbas8cgr', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/93YKYGralckcX2zPtumm4yYnvwIlA8PswQCy06OLCjgbas8cgr', 1),
                ('lO7G2kEENMipb70eNfxl7BJ0cEhbQs2ECZSOhDe1cxq4mX19YU', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/lO7G2kEENMipb70eNfxl7BJ0cEhbQs2ECZSOhDe1cxq4mX19YU', 1),
                ('omf7Z55rDB1qyNS0XXj1ExcgjmDnQU97DNVHhPpShTrhCcfE5j', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/omf7Z55rDB1qyNS0XXj1ExcgjmDnQU97DNVHhPpShTrhCcfE5j', 1),
                ('GA4CKQVHJ4f4P951uTS4Up8lA35ZroGmZQcHUJfDhPAqIHuFkc', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/GA4CKQVHJ4f4P951uTS4Up8lA35ZroGmZQcHUJfDhPAqIHuFkc', 1),
                ('gpROZ6ZdpPZosXOhJvkxdTx08ZQtTk5HNcCHl4N93vOBPevUpz', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/gpROZ6ZdpPZosXOhJvkxdTx08ZQtTk5HNcCHl4N93vOBPevUpz', 1),
                ('3GjEcotZnwBS6b3jG0Y5qycyWA3pfN6wNViVhs1a9y8KE2fNHh', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/3GjEcotZnwBS6b3jG0Y5qycyWA3pfN6wNViVhs1a9y8KE2fNHh', 1),
                ('Dbx8cItkBoDW5B8gBHRpKVeqrPMFwR4sC0NVBrFIoH5U4uoMP5', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/Dbx8cItkBoDW5B8gBHRpKVeqrPMFwR4sC0NVBrFIoH5U4uoMP5', 1),
                ('PtPyA5DZHYHAfa1bXGkP6mOPhb0SjmagdNumtC8i5rq1x5QJIn', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/PtPyA5DZHYHAfa1bXGkP6mOPhb0SjmagdNumtC8i5rq1x5QJIn', 1),
                ('zAZ4l1rwPuUlF7KQJwFXn2brF3JGfXp7dtsZ61ii7m3j4g2cAd', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/zAZ4l1rwPuUlF7KQJwFXn2brF3JGfXp7dtsZ61ii7m3j4g2cAd', 1),
                ('YUAaWx2x3e4kUWUoK64RSSpgfje1McZDEeGv9xYJV9RP13zJg1', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/YUAaWx2x3e4kUWUoK64RSSpgfje1McZDEeGv9xYJV9RP13zJg1', 1),
                ('LesKq45RXd6mCZ9Ei26hGpblQx680cWVokrm7MPyUbpuz06lOS', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/LesKq45RXd6mCZ9Ei26hGpblQx680cWVokrm7MPyUbpuz06lOS', 1),
                ('NIqnmyt8gNYSm2mC13G2gqXIICZMOcKR7HZJAzWc4B6AD9ZT74', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/NIqnmyt8gNYSm2mC13G2gqXIICZMOcKR7HZJAzWc4B6AD9ZT74', 1),
                ('2F3WWeTguc36w1hTLierf9NS78nXXSgLDdaho4rm4U3UZvIx6R', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/2F3WWeTguc36w1hTLierf9NS78nXXSgLDdaho4rm4U3UZvIx6R', 1),
                ('hE7RSr6TnpzprKYh3Wy4MGv2LMPLbrmCN4bKfC0ABpSbJJPZOU', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/hE7RSr6TnpzprKYh3Wy4MGv2LMPLbrmCN4bKfC0ABpSbJJPZOU', 1),
                ('whzbM7iqQyMhvouaelhnC5jGF7EuF7LB9282o1zG8ZJctwAYiW', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/whzbM7iqQyMhvouaelhnC5jGF7EuF7LB9282o1zG8ZJctwAYiW', 1),
                ('H2d4dmN1Mij0GeV1qgmx3mGBoNB8pUNsQMpfudsVCHtVRQranj', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/H2d4dmN1Mij0GeV1qgmx3mGBoNB8pUNsQMpfudsVCHtVRQranj', 1),
                ('5RUuGVy3KwEfgeNKSAesusBEEIh6qsiVCLvPJvbbPSpJWvcEHM', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/5RUuGVy3KwEfgeNKSAesusBEEIh6qsiVCLvPJvbbPSpJWvcEHM', 1),
                ('lsHeC0ixS7XqyX9LJYokgejlJQzkPVZaKUU67fQse4mxa4I2MC', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/lsHeC0ixS7XqyX9LJYokgejlJQzkPVZaKUU67fQse4mxa4I2MC', 1),
                ('cN42xG3052t8hoLO7Wj5sa8a3WmFe2rks5V1Rbz75rtWMElamF', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/cN42xG3052t8hoLO7Wj5sa8a3WmFe2rks5V1Rbz75rtWMElamF', 1),
                ('jXpi8T4U8f8WfkL3FYF6kyDy0iSvuL6rWqIZVbiEHZFUN2tHP3', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/jXpi8T4U8f8WfkL3FYF6kyDy0iSvuL6rWqIZVbiEHZFUN2tHP3', 1),
                ('C2CRoIOzcTKX41vD5Gexv1NClHoTDVw4aqNPge40xb7Fc7Enau', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/C2CRoIOzcTKX41vD5Gexv1NClHoTDVw4aqNPge40xb7Fc7Enau', 1),
                ('5SheafwQ5pSJDpyrWmfBYRgPZlPCCbrQyOWN4OicpeWrYlokLe', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/5SheafwQ5pSJDpyrWmfBYRgPZlPCCbrQyOWN4OicpeWrYlokLe', 1),
                ('ENvzvGbcw1QNqIAZX26YzWc9dQ2REZT2JpAGxopXaqCqilamnR', 'jpeg', 'public', 'https://test-mangloo.s3.us-east-1.amazonaws.com/public/ENvzvGbcw1QNqIAZX26YzWc9dQ2REZT2JpAGxopXaqCqilamnR', 1)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "system"."files"
            WHERE "name" IN (
                'ljWl5sqiYYNb3bNw4BLXe46go81Gg4ctrM8PjGjBOlVqEf6AYr',
                'T0fzJO7MKIaZwX3oIDqUdTuuRDYdmAZClGonLfczjAl1qKBcWw',
                '93YKYGralckcX2zPtumm4yYnvwIlA8PswQCy06OLCjgbas8cgr',
                'lO7G2kEENMipb70eNfxl7BJ0cEhbQs2ECZSOhDe1cxq4mX19YU',
                'omf7Z55rDB1qyNS0XXj1ExcgjmDnQU97DNVHhPpShTrhCcfE5j',
                'GA4CKQVHJ4f4P951uTS4Up8lA35ZroGmZQcHUJfDhPAqIHuFkc',
                'gpROZ6ZdpPZosXOhJvkxdTx08ZQtTk5HNcCHl4N93vOBPevUpz',
                '3GjEcotZnwBS6b3jG0Y5qycyWA3pfN6wNViVhs1a9y8KE2fNHh',
                'Dbx8cItkBoDW5B8gBHRpKVeqrPMFwR4sC0NVBrFIoH5U4uoMP5',
                'PtPyA5DZHYHAfa1bXGkP6mOPhb0SjmagdNumtC8i5rq1x5QJIn',
                'zAZ4l1rwPuUlF7KQJwFXn2brF3JGfXp7dtsZ61ii7m3j4g2cAd',
                'YUAaWx2x3e4kUWUoK64RSSpgfje1McZDEeGv9xYJV9RP13zJg1',
                'LesKq45RXd6mCZ9Ei26hGpblQx680cWVokrm7MPyUbpuz06lOS',
                'NIqnmyt8gNYSm2mC13G2gqXIICZMOcKR7HZJAzWc4B6AD9ZT74',
                '2F3WWeTguc36w1hTLierf9NS78nXXSgLDdaho4rm4U3UZvIx6R',
                'hE7RSr6TnpzprKYh3Wy4MGv2LMPLbrmCN4bKfC0ABpSbJJPZOU',
                'whzbM7iqQyMhvouaelhnC5jGF7EuF7LB9282o1zG8ZJctwAYiW',
                'H2d4dmN1Mij0GeV1qgmx3mGBoNB8pUNsQMpfudsVCHtVRQranj',
                '5RUuGVy3KwEfgeNKSAesusBEEIh6qsiVCLvPJvbbPSpJWvcEHM',
                'lsHeC0ixS7XqyX9LJYokgejlJQzkPVZaKUU67fQse4mxa4I2MC',
                'cN42xG3052t8hoLO7Wj5sa8a3WmFe2rks5V1Rbz75rtWMElamF',
                'jXpi8T4U8f8WfkL3FYF6kyDy0iSvuL6rWqIZVbiEHZFUN2tHP3',
                'C2CRoIOzcTKX41vD5Gexv1NClHoTDVw4aqNPge40xb7Fc7Enau',
                '5SheafwQ5pSJDpyrWmfBYRgPZlPCCbrQyOWN4OicpeWrYlokLe',
                'ENvzvGbcw1QNqIAZX26YzWc9dQ2REZT2JpAGxopXaqCqilamnR'
            )
        `);
    }
}
