import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminsModule } from './admins/admins.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ClientsModule } from './clients/clients.module';
import { ConfiguratorModule } from './configurator/configurator.module';
import { MaterialsModule } from './materials/materials.module';
import { OrdersModule } from './orders/orders.module';
import { PricingModule } from './pricing/pricing.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SettingsModule } from './settings/settings.module';
import { StatsModule } from './stats/stats.module';
import { UploadsModule } from './uploads/uploads.module';
import { WishlistModule } from './wishlist/wishlist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Лимиты включаются точечно через @UseGuards(ThrottlerGuard) + @Throttle(...) на нужных методах
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    SettingsModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    MaterialsModule,
    ReviewsModule,
    PricingModule,
    ConfiguratorModule,
    OrdersModule,
    WishlistModule,
    ClientsModule,
    StatsModule,
    UploadsModule,
    AdminsModule,
  ],
})
export class AppModule {}
