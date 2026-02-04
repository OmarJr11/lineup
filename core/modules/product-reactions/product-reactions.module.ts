import { Module } from '@nestjs/common';
import { ProductReactionsService } from './product-reactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductReaction } from '../../entities';
import { ProductReactionsGettersService } from './product-reactions-getters.service';
import { ProductReactionsSettersService } from './product-reactions-setters.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductReaction]),
    ProductsModule
  ],
  providers: [
    ProductReactionsService,
    ProductReactionsGettersService,
    ProductReactionsSettersService
  ],
  exports: [
    ProductReactionsService,
    ProductReactionsGettersService,
    ProductReactionsSettersService
  ]
})
export class ProductReactionsModule {}
