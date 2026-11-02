import { Global, Module } from '@nestjs/common';
import { AdminSettingsController, SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

// Global — настройки нужны расчёту цены, конструктору и заказам
@Global()
@Module({
  controllers: [SettingsController, AdminSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
