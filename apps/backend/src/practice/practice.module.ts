import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';
import { Question } from '../database/entities/question.entity';
import { PracticeLog } from '../database/entities/practice-log.entity';
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [TypeOrmModule.forFeature([Question, PracticeLog]), I18nModule],
  controllers: [PracticeController],
  providers: [PracticeService],
  exports: [PracticeService],
})
export class PracticeModule {}
