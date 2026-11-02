import { Module } from '@nestjs/common';
import { AdminMaterialsController } from './admin-materials.controller';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';

@Module({
  controllers: [MaterialsController, AdminMaterialsController],
  providers: [MaterialsService],
})
export class MaterialsModule {}
