import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { Topic } from '../database/entities/topic.entity';
import { I18nModule } from '../i18n/i18n.module';

@Module({
  imports: [TypeOrmModule.forFeature([Topic]), I18nModule],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}
