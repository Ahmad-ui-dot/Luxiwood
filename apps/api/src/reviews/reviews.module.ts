import { Module } from '@nestjs/common';
import { AdminReviewsController, LatestReviewsController, ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [ReviewsController, LatestReviewsController, AdminReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
