import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from '../../entities';
import { TokensService } from './token.service';
import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forFeature([Token]),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule { }
