import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities';
import { TransactionService } from '../../common/services/transaction.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService, TransactionService],
  exports: [UsersService],
})
export class UsersModule {}
