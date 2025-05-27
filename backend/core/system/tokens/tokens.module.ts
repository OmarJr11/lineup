import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from '../../entities';
import { JwtModule } from '@nestjs/jwt';
import { TokensService } from './tokens.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token]),
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}
