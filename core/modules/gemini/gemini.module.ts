import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiService } from './gemini.service';

/**
 * Module for Google Gemini API integration.
 * Exports GeminiService for use in other modules.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
  ],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule {}
