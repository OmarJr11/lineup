import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSearch } from '../../entities';
import { UserSearchesSettersService } from './user-searches-setters.service';
import { UserSearchesGettersService } from './user-searches-getters.service';
import { UserSearchesService } from './user-searches.service';

@Module({
    imports: [TypeOrmModule.forFeature([UserSearch])],
    providers: [
        UserSearchesService,
        UserSearchesSettersService,
        UserSearchesGettersService,
    ],
    exports: [
        UserSearchesService,
        UserSearchesSettersService,
        UserSearchesGettersService,
    ],
})
export class UserSearchesModule {}
