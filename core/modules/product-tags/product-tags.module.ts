import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTag } from '../../entities';
import { ProductTagsService } from './product-tags.service';
import { TagsModule } from '../tags/tags.module';
import { ProductsModule } from '../products/products.module';
import { GeminiModule } from '../gemini/gemini.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductTag]),
    TagsModule,
    forwardRef(() => ProductsModule),
    GeminiModule,
  ],
  providers: [ProductTagsService],
  exports: [ProductTagsService],
})
export class ProductTagsModule {}
