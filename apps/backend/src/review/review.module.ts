import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { Question } from '../database/entities/question.entity';
import { QuestionRevision } from '../database/entities/question-revision.entity';
import { ContentReview } from '../database/entities/content-review.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, QuestionRevision, ContentReview]),
    AuthModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
