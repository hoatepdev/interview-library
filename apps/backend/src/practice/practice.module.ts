import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';
import { Question } from '../database/entities/question.entity';
import { PracticeLog } from '../database/entities/practice-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, PracticeLog])],
  controllers: [PracticeController],
  providers: [PracticeService],
  exports: [PracticeService],
})
export class PracticeModule {}
