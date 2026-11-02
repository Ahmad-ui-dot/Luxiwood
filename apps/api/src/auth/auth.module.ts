import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../mail/mail.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

// Global — чтобы @Auth() и @Roles() работали в контроллерах любого модуля
@Global()
@Module({
  imports: [
    MailModule,
    JwtModule.registerAsync({
      global: true,
      useFactory: () => {
        if (!process.env.JWT_SECRET) {
          throw new Error('Укажите JWT_SECRET в apps/api/.env');
        }
        return { secret: process.env.JWT_SECRET, signOptions: { expiresIn: '7d' } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
