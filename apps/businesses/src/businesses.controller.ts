import { Controller, Get } from '@nestjs/common';

@Controller()
export class BusinessesController {
  constructor() {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}
