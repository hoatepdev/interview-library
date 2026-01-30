import { IsEnum } from 'class-validator';
import { QuestionStatus } from '../../database/entities/question.entity';

export class UpdateQuestionStatusDto {
  @IsEnum(QuestionStatus)
  status: QuestionStatus;
}
