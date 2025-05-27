import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { Token, User } from '../../../core/entities';

dotenv.config();

@Module({
  imports: [

    TypeOrmModule.forRootAsync({
      useFactory() {
        return {
          type: 'postgres',
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT),
          username: String(process.env.DB_USERNAME),
          password: String(process.env.DB_PASSWORD),
          database: process.env.DB_NAME,
          entities: [
            User,
            Token
          ],
          synchronize: true,
          logging: false,
        };
      },
    }),
    UsersModule
  ],
})
export class SystemModule {}
