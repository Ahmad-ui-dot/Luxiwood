import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/auth.decorators';
import { ApiError } from '../common/api-error.decorator';
import { ApiPaginatedResponse } from '../common/dto/paginated-response.dto';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { ClientDetailsDto, ClientDto, ClientQueryDto } from './clients.dto';
import { ClientsService } from './clients.service';

@ApiTags('Админ: клиенты')
@Roles('ADMIN')
@Controller('admin/clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  @ApiOperation({
    summary: 'Клиенты',
    description: 'Только администратор. Зарегистрированные покупатели: число заказов, сумма покупок (без отменённых), последний заказ. Поиск по имени, телефону, email; сортировка sort и фильтр hasOrders.',
  })
  @ApiPaginatedResponse(ClientDto, 'Страница клиентов')
  findAll(@Query() query: ClientQueryDto) {
    return this.clientsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Клиент и его заказы', description: 'Только администратор.' })
  @ApiParam({ name: 'id', description: 'ID клиента', example: 2 })
  @ApiOkResponse({ description: 'Клиент', type: ClientDetailsDto })
  @ApiError(404, 'Клиент не найден')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.clientsService.findOne(id);
  }
}
