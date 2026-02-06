import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Currency } from '../../entities';
import { CurrenciesService } from './currencies.service';
import { CurrenciesGettersService } from './currencies-getters.service';
import { CurrenciesSettersService } from './currencies-setters.service';

@Module({
    imports: [TypeOrmModule.forFeature([Currency])],
    providers: [
        CurrenciesService,
        CurrenciesGettersService,
        CurrenciesSettersService,
    ],
    exports: [
        CurrenciesService,
        CurrenciesGettersService,
        CurrenciesSettersService,
    ],
})
export class CurrenciesModule {}
