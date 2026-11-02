import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import type { AuthUser } from '../auth/auth.guard';
import { ApiError, ApiValidationError } from '../common/api-error.decorator';
import { ParseIdPipe } from '../common/parse-id.pipe';
import { AdminUserDto, CreateAdminDto, UpdateAdminDto } from './admins.dto';
import { AdminsService } from './admins.service';

@ApiTags('Админ: администраторы')
@Roles('ADMIN')
@Controller('admin/admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  @ApiOperation({ summary: 'Администраторы', description: 'Только администратор. Все, кто может входить в админку, по порядку создания.' })
  @ApiOkResponse({ description: 'Администраторы', type: [AdminUserDto] })
  findAll() {
    return this.adminsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Добавить администратора', description: 'Только администратор. Имя и email уникальны среди всех пользователей — по ним входят.' })
  @ApiBody({ type: CreateAdminDto, examples: { manager: { summary: 'Менеджер', value: { name: 'Менеджер', email: 'manager@luxiwood.tj', password: 'manager123' } } } })
  @ApiCreatedResponse({ description: 'Администратор создан', type: AdminUserDto })
  @ApiValidationError('Пароль — не короче 6 символов')
  @ApiError(409, 'Имя «Менеджер» уже занято')
  create(@Body() dto: CreateAdminDto) {
    return this.adminsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Изменить администратора',
    description: 'Только администратор. Меняются только переданные поля. После смены пароля старые входы этого администратора перестают действовать.',
  })
  @ApiParam({ name: 'id', description: 'ID администратора', example: 1 })
  @ApiBody({ type: UpdateAdminDto, examples: { password: { summary: 'Новый пароль', value: { password: 'new-secret-1' } } } })
  @ApiOkResponse({ description: 'Администратор изменён', type: AdminUserDto })
  @ApiValidationError('Имя — от 2 до 50 символов')
  @ApiError(404, 'Администратор не найден')
  @ApiError(409, 'Пользователь с таким email уже есть')
  update(@Param('id', ParseIdPipe) id: number, @Body() dto: UpdateAdminDto) {
    return this.adminsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить администратора', description: 'Только администратор. Себя и последнего администратора удалить нельзя.' })
  @ApiParam({ name: 'id', description: 'ID администратора', example: 2 })
  @ApiOkResponse({ description: 'Администратор удалён — в ответе удалённая запись', type: AdminUserDto })
  @ApiError(400, 'Нельзя удалить самого себя — войдите под другим администратором')
  @ApiError(404, 'Администратор не найден')
  @ApiError(409, 'Нельзя удалить последнего администратора')
  remove(@Param('id', ParseIdPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.adminsService.remove(id, user.id);
  }
}
