import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
dotenv.config();
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: "postgres",
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: String(process.env.DB_PASSWORD),
        database: process.env.DB_NAME,
        entities: [],
        synchronize: false,
      }),
    }),
  ],
})
export class PublicModule {}
