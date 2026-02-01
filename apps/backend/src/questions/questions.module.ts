import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { Question } from '../database/entities/question.entity';
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [TypeOrmModule.forFeature([Question]), I18nModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
