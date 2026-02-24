import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Topic } from "../database/entities/topic.entity";
import { Question } from "../database/entities/question.entity";
import { TopicTranslation } from "../database/entities/topic-translation.entity";
import { QuestionTranslation } from "../database/entities/question-translation.entity";
import { TranslationController } from "./translation.controller";
import { TranslationService } from "./translation-crud.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Topic,
      Question,
      TopicTranslation,
      QuestionTranslation,
    ]),
  ],
  controllers: [TranslationController],
  providers: [TranslationService],
  exports: [TranslationService],
})
export class TranslationModule {}
