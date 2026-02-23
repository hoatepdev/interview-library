import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from '../database/entities/question.entity';
import { UserQuestion } from '../database/entities/user-question.entity';
import { Topic } from '../database/entities/topic.entity';
import { I18nModule } from '../i18n/i18n.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Question, UserQuestion, Topic]), I18nModule, AuthModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
