import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { extname, join } from 'node:path';
import {
  BadRequestException,
  Controller,
  Delete,
  NotFoundException,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { diskStorage } from 'multer';
import { Roles } from '../auth/auth.decorators';
import { ApiError } from '../common/api-error.decorator';

// Папка apps/api/uploads — раздаётся как статика по адресу /uploads/...
export const UPLOADS_DIR = join(__dirname, '..', '..', 'uploads');

const MB = 1024 * 1024;
const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp'];
const FILE_URL = /^\/uploads\/(images|models)\/[a-f0-9]+\.(jpg|jpeg|png|webp|glb)$/;

const FILE_BODY = {
  schema: {
    type: 'object',
    required: ['file'],
    properties: { file: { type: 'string', format: 'binary', description: 'Файл' } },
  },
};

export class UploadResponseDto {
  @ApiProperty({ description: 'Ссылка на файл. Её кладут в images или modelUrl товара', example: '/uploads/images/3f2c9a1b7d4e5f60.jpg' })
  url: string;

  @ApiProperty({ description: 'Размер, байт', type: 'integer', example: 245760 })
  size: number;

  @ApiProperty({ description: 'Имя файла у администратора', example: 'divan-front.jpg' })
  originalName: string;
}

export class DeleteUploadQueryDto {
  @ApiProperty({ description: 'Ссылка из ответа загрузки', example: '/uploads/images/3f2c9a1b7d4e5f60.jpg' })
  @IsString({ message: 'Укажите ссылку на файл' })
  @MaxLength(200, { message: 'Ссылка — не длиннее 200 символов' })
  url: string;
}

export class DeleteUploadResultDto {
  @ApiProperty({ description: 'Ссылка удалённого файла', example: '/uploads/images/3f2c9a1b7d4e5f60.jpg' })
  url: string;

  @ApiProperty({ description: 'Что произошло', example: 'Файл удалён' })
  message: string;
}

// Сохраняет файл в uploads/<folder> под случайным именем, проверяет расширение и размер
function fileInterceptor(folder: 'images' | 'models', extensions: string[], maxMb: number, typeError: string) {
  const destination = join(UPLOADS_DIR, folder);
  return FileInterceptor('file', {
    storage: diskStorage({
      destination: (_req, _file, callback) => {
        if (!existsSync(destination)) {
          mkdirSync(destination, { recursive: true });
        }
        callback(null, destination);
      },
      filename: (_req, file, callback) =>
        callback(null, randomBytes(8).toString('hex') + extname(file.originalname).toLowerCase()),
    }),
    limits: { fileSize: maxMb * MB, files: 1 },
    fileFilter: (_req, file, callback) => {
      const allowed = extensions.includes(extname(file.originalname).toLowerCase());
      callback(allowed ? null : new BadRequestException(typeError), allowed);
    },
  });
}

function toResponse(folder: string, file: Express.Multer.File | undefined) {
  if (!file) {
    throw new BadRequestException('Прикрепите файл в поле file');
  }
  return { url: `/uploads/${folder}/${file.filename}`, size: file.size, originalName: file.originalname };
}

@ApiTags('Админ: загрузки')
@Roles('ADMIN')
@Controller('admin/uploads')
export class UploadsController {
  @Post('image')
  @UseInterceptors(fileInterceptor('images', IMAGE_TYPES, 5, 'Можно загрузить только фото jpg, png или webp'))
  @ApiOperation({
    summary: 'Загрузить фото',
    description: 'Только администратор. Форматы: jpg, jpeg, png, webp. Размер — до 5 МБ. Ответ — ссылка, её нужно добавить в images товара.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_BODY)
  @ApiCreatedResponse({ description: 'Фото сохранено', type: UploadResponseDto })
  @ApiError(400, 'Можно загрузить только фото jpg, png или webp', 'Прикрепите файл в поле file')
  @ApiError(413, 'Файл слишком большой: фото — до 5 МБ, 3D-модель — до 30 МБ')
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    return toResponse('images', file);
  }

  @Post('model')
  @UseInterceptors(fileInterceptor('models', ['.glb'], 30, 'Можно загрузить только 3D-модель в формате .glb'))
  @ApiOperation({
    summary: 'Загрузить 3D-модель',
    description: 'Только администратор. Только .glb, до 30 МБ (рекомендуется до 5 МБ, чтобы быстро открывалась на телефоне). Ответ — ссылка для modelUrl товара.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody(FILE_BODY)
  @ApiCreatedResponse({ description: 'Модель сохранена', type: UploadResponseDto, example: { url: '/uploads/models/5d1e0a7b9c2f4e31.glb', size: 3145728, originalName: 'divan.glb' } })
  @ApiError(400, 'Можно загрузить только 3D-модель в формате .glb', 'Прикрепите файл в поле file')
  @ApiError(413, 'Файл слишком большой: фото — до 5 МБ, 3D-модель — до 30 МБ')
  uploadModel(@UploadedFile() file?: Express.Multer.File) {
    return toResponse('models', file);
  }

  @Delete()
  @ApiOperation({
    summary: 'Удалить файл',
    description: 'Только администратор. Удаляет загруженное фото или модель по ссылке. Ссылку из товара (images, modelUrl) нужно убрать отдельно через PATCH товара.',
  })
  @ApiOkResponse({ description: 'Файл удалён', type: DeleteUploadResultDto })
  @ApiError(400, 'Это не ссылка на загруженный файл. Пример: /uploads/images/3f2c9a1b7d4e5f60.jpg')
  @ApiError(404, 'Файл не найден')
  async remove(@Query() query: DeleteUploadQueryDto) {
    const url = query.url.trim();
    if (!FILE_URL.test(url)) {
      throw new BadRequestException('Это не ссылка на загруженный файл. Пример: /uploads/images/3f2c9a1b7d4e5f60.jpg');
    }
    const path = join(UPLOADS_DIR, url.replace('/uploads/', ''));
    if (!existsSync(path)) {
      throw new NotFoundException('Файл не найден');
    }
    await unlink(path);
    return { url, message: 'Файл удалён' };
  }
}
