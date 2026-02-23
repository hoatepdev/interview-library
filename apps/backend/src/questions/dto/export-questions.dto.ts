import { IsOptional, IsEnum, IsUUID, IsIn } from 'class-validator';
import { QuestionLevel } from '../../database/entities/question.entity';

export class ExportQuestionsDto {
  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsEnum(QuestionLevel)
  level?: QuestionLevel;

  @IsIn(['json', 'csv'])
  format: 'json' | 'csv';
}
