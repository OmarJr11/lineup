import { SetMetadata } from '@nestjs/common';

export const Response = (...response: [{}]) => SetMetadata('response', response);
