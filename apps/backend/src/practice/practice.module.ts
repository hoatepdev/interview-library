import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';
import { Question } from '../database/entities/question.entity';
import { PracticeLog } from '../database/entities/practice-log.entity';
import { UserQuestion } from '../database/entities/user-question.entity';
import { I18nModule } from '../i18n/i18n.module';
import { SpacedRepetitionService } from './spaced-repetition.service';

@Module({
  imports: [TypeOrmModule.forFeature([Question, PracticeLog, UserQuestion]), I18nModule],
  controllers: [PracticeController],
  providers: [PracticeService, SpacedRepetitionService],
  exports: [PracticeService],
})
export class PracticeModule {}
