import { Controller, Get } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller()
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get()
  getHello(): string {
    return this.publicService.getHello();
  }
}
