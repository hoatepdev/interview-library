import { IsOptional, IsEnum, IsString, IsUUID, IsBoolean } from 'class-validator';
import { QuestionLevel, QuestionStatus } from '../../database/entities/question.entity';
import { Type } from 'class-transformer';

export class QueryQuestionsDto {
  @IsOptional()
  @IsUUID()
  topicId?: string;

  @IsOptional()
  @IsEnum(QuestionLevel)
  level?: QuestionLevel;

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  favorite?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
