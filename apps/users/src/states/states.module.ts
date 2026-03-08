import { Module } from '@nestjs/common';
import { StatesModule as StatesModuleCore } from '../../../../core/modules/states/states.module';
import { StatesResolver } from './states.resolver';

@Module({
    providers: [StatesResolver],
    imports: [StatesModuleCore],
})
export class StatesModule {}
