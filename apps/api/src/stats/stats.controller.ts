import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/auth.decorators';
import { StatsDto } from './stats.dto';
import { StatsService } from './stats.service';

@ApiTags('Админ: обзор')
@Roles('ADMIN')
@Controller('admin/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({
    summary: 'Обзор магазина',
    description:
      'Только администратор. Выручка и число заказов за текущий и прошлый месяц с разницей в %, средний чек, сколько заказов в работе и новых, ' +
      'выручка по месяцам за полгода, продажи по типам мебели, топ-5 товаров и 5 последних заказов. Отменённые заказы не учитываются.',
  })
  @ApiOkResponse({ description: 'Обзор', type: StatsDto })
  overview() {
    return this.statsService.overview();
  }
}
