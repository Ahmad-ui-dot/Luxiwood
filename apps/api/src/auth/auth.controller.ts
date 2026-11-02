import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiError, ApiValidationError } from '../common/api-error.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Auth, CurrentUser } from './auth.decorators';
import { AuthUser } from './auth.guard';
import { AuthService } from './auth.service';
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, UpdateMeDto } from './dto/auth.dto';
import { AuthTokenDto, MessageResponseDto, UserResponseDto } from './dto/auth.response.dto';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Регистрация покупателя',
    description:
      'Доступно всем. Создаёт покупателя (роль CLIENT) и сразу возвращает токен. Имя и email — логины для входа, оба должны быть свободны ' +
      '(имя — без учёта регистра). Телефон необязателен: он нужен только для связи по заказам. Не больше 10 попыток в минуту с одного IP.',
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      phone: { summary: 'С телефоном', value: { name: 'Зарина', email: 'zarina@gmail.com', phone: '+992 93 000 00 05', password: 'zarina12345' } },
      email: { summary: 'Без телефона', value: { name: 'Фарход', email: 'farhod@gmail.com', password: 'farhod12345' } },
    },
  })
  @ApiCreatedResponse({ description: 'Покупатель создан, вход выполнен', type: AuthTokenDto })
  @ApiValidationError('Неверный формат email. Пример: zarina@gmail.com', 'Пароль — не короче 6 символов')
  @ApiError(
    409,
    'Имя «Мадина» уже занято — выберите другое, например «Мадина К.»',
    'Пользователь с таким телефоном уже зарегистрирован',
    'Пользователь с таким email уже зарегистрирован',
  )
  @ApiError(429, 'Слишком много запросов. Попробуйте через минуту')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Вход по имени или email и паролю',
    description:
      'Доступно всем. Для покупателей и администратора. В login — имя пользователя (регистр не важен) или email (Gmail). ' +
      'Телефон для входа не используется. ' +
      'Скопируйте accessToken из ответа, нажмите Authorize вверху страницы и вставьте токен. Не больше 10 попыток в минуту с одного IP.',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      admin: { summary: 'Администратор (пароль — ADMIN_PASSWORD из apps/api/.env)', value: { login: 'Администратор', password: 'change-me' } },
      client: { summary: 'Тестовый клиент из seed', value: { login: 'Мадина', password: 'client12345' } },
      email: { summary: 'Тестовый клиент по email', value: { login: 'madina@gmail.com', password: 'client12345' } },
    },
  })
  @ApiOkResponse({ description: 'Вход выполнен', type: AuthTokenDto })
  @ApiValidationError('Укажите имя или email')
  @ApiError(401, 'Неверный логин или пароль')
  @ApiError(429, 'Слишком много запросов. Попробуйте через минуту')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'Мой профиль', description: 'Нужен вход (любая роль). Данные текущего пользователя без пароля.' })
  @ApiOkResponse({ description: 'Профиль', type: UserResponseDto })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }

  @Patch('me')
  @Auth()
  @ApiOperation({
    summary: 'Изменить профиль',
    description:
      'Нужен вход. Меняются только переданные поля: имя (оно же логин), email, телефон, адрес доставки по умолчанию. Имя, email и телефон не должны быть заняты.',
  })
  @ApiBody({ type: UpdateMeDto, examples: { address: { summary: 'Новый адрес', value: { defaultAddress: 'Душанбе, ул. Айни, 25, кв. 4' } } } })
  @ApiOkResponse({ description: 'Профиль обновлён', type: UserResponseDto })
  @ApiValidationError('Неверный формат телефона. Пример: +992 90 123 45 67', 'Неверный формат email. Пример: zarina@gmail.com')
  @ApiError(
    409,
    'Имя «Мадина» уже занято — выберите другое, например «Мадина К.»',
    'Пользователь с таким телефоном уже зарегистрирован',
    'Пользователь с таким email уже зарегистрирован',
  )
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(user.id, dto);
  }

  @Patch('password')
  @Auth()
  @ApiOperation({
    summary: 'Сменить пароль',
    description:
      'Нужен вход (любая роль). Нужно ввести текущий пароль и новый (от 6 символов, не такой же). ' +
      'После смены все прежние токены перестают действовать — в ответе новый accessToken, его нужно заново вставить в Authorize.',
  })
  @ApiBody({ type: ChangePasswordDto, examples: { change: { summary: 'Новый пароль', value: { currentPassword: 'client12345', newPassword: 'newPassword123' } } } })
  @ApiOkResponse({ description: 'Пароль изменён, вход выполнен с новым токеном', type: AuthTokenDto })
  @ApiError(
    400,
    { message: 'Проверьте введённые данные', errors: ['Новый пароль — не короче 6 символов'] },
    'Текущий пароль введён неверно',
    'Новый пароль должен отличаться от текущего',
  )
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Забыли пароль: отправить код на email',
    description:
      'Доступно всем. Отправляет на email (Gmail) 6-значный код, он действует 15 минут. Новый запрос отменяет прежний код. ' +
      'Ответ одинаковый, есть такой email или нет, — чтобы нельзя было узнать, кто зарегистрирован. ' +
      'Пока в apps/api/.env не заданы SMTP_USER и SMTP_PASS, при разработке письмо не уходит, а печатается в консоль API. ' +
      'Не больше 5 запросов в минуту с одного IP.',
  })
  @ApiBody({ type: ForgotPasswordDto, examples: { client: { summary: 'Тестовый клиент', value: { email: 'madina@gmail.com' } } } })
  @ApiOkResponse({ description: 'Запрос принят', type: MessageResponseDto })
  @ApiValidationError('Неверный формат email. Пример: zarina@gmail.com')
  @ApiError(429, 'Слишком много запросов. Попробуйте через минуту')
  @ApiResponse({
    status: 503,
    description: 'Почта не настроена или Gmail не принял письмо',
    type: ErrorResponseDto,
    example: { statusCode: 503, message: 'Не удалось отправить письмо. Попробуйте позже' },
  })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Забыли пароль: новый пароль по коду',
    description:
      'Доступно всем. Email, код из письма и новый пароль. Код одноразовый, действует 15 минут, после 5 неверных попыток нужен новый код. ' +
      'Сразу выполняет вход: в ответе новый accessToken, прежние токены перестают действовать.',
  })
  @ApiBody({ type: ResetPasswordDto, examples: { reset: { summary: 'Код из письма', value: { email: 'madina@gmail.com', code: '483920', newPassword: 'newPassword123' } } } })
  @ApiOkResponse({ description: 'Пароль изменён, вход выполнен', type: AuthTokenDto })
  @ApiError(400, { message: 'Проверьте введённые данные', errors: ['Код — 6 цифр из письма'] }, 'Код неверный или устарел. Запросите новый код')
  @ApiError(429, 'Слишком много запросов. Попробуйте через минуту')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
