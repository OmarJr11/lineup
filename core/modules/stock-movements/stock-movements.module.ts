import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from '../../entities';
import { StockMovementsService } from './stock-movements.service';
import { StockMovementsGettersService } from './stock-movements-getters.service';
import { StockMovementsSettersService } from './stock-movements-setters.service';

/**
 * Module that encapsulates stock movement (inventory history) functionality.
 */
@Module({
  imports: [TypeOrmModule.forFeature([StockMovement])],
  providers: [
    StockMovementsService,
    StockMovementsGettersService,
    StockMovementsSettersService,
  ],
  exports: [
    StockMovementsService,
    StockMovementsGettersService,
    StockMovementsSettersService,
  ],
})
export class StockMovementsModule {}
