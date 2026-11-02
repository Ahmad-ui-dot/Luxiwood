import { BadRequestException, Injectable, ParseIntPipe } from '@nestjs/common';

// ID в пути (/products/5): целое число, иначе 400 с понятным текстом
@Injectable()
export class ParseIdPipe extends ParseIntPipe {
  constructor() {
    super({ exceptionFactory: () => new BadRequestException('ID в адресе должен быть целым числом') });
  }
}
