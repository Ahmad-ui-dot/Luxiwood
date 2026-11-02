import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { MaterialQueryDto } from './dto/material-query.dto';
import { MaterialResponseDto } from './dto/material.response.dto';
import { MaterialsService } from './materials.service';

@ApiTags('Материалы')
@Controller()
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get('materials')
  @ApiOperation({
    summary: 'Справочник материалов',
    description:
      'Доступно всем, без входа. Только активные материалы: ткани обивки (FABRIC), цвета обивки (COLOR), ' +
      'породы дерева (WOOD) и покрытия дерева (FINISH). Сортировка: по типу, затем по ID. ' +
      'hex — цвет для 3D-модели, priceDelta — доплата в целых сомони. ' +
      'Неизвестный тип или лишний параметр запроса — ошибка 400.',
  })
  @ApiOkResponse({
    description: 'Материалы. Пустой массив — если подходящих нет',
    type: [MaterialResponseDto],
    example: [
      { id: 1, type: 'FABRIC', name: 'Букле', hex: '#EDE6DA', priceDelta: 0, isActive: true },
      { id: 5, type: 'COLOR', name: 'Изумруд', hex: '#1F6B55', priceDelta: 0, isActive: true },
      { id: 11, type: 'WOOD', name: 'Орех', hex: '#6B4630', priceDelta: 600, isActive: true },
    ],
  })
  @ApiBadRequestResponse({
    description: 'Неверный тип материала или лишний параметр',
    type: ErrorResponseDto,
    example: { statusCode: 400, message: 'Проверьте введённые данные', errors: ['Тип материала: FABRIC, COLOR, WOOD или FINISH'] },
  })
  findActive(@Query() query: MaterialQueryDto) {
    return this.materialsService.findActive(query);
  }
}
