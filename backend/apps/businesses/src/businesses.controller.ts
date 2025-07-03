import { Controller, Get } from '@nestjs/common';
import { BusinessesService } from './businesses.service';

@Controller()
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  getHello(): string {
    return this.businessesService.getHello();
  }
}
