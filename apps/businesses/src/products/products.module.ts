import { Module } from '@nestjs/common';
import { ProductsResolver } from './products.resolver';
import { ProductsModule as ProductsModuleCore } from '../../../../core/modules/products/products.module';
import { RolesModule } from 'core/modules/roles/roles.module';
import { TokensModule } from 'core/modules/token/token.module';

@Module({
  imports: [
    ProductsModuleCore,
    RolesModule,
    TokensModule
  ],  
  providers: [ProductsResolver],
})
export class ProductsModule {}
