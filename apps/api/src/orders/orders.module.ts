import { Module } from '@nestjs/common';
import { ConfiguratorModule } from '../configurator/configurator.module';
import { PricingModule } from '../pricing/pricing.module';
import { AdminOrdersController } from './admin-orders.controller';
import { MyOrdersController, OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [PricingModule, ConfiguratorModule],
  controllers: [OrdersController, MyOrdersController, AdminOrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
