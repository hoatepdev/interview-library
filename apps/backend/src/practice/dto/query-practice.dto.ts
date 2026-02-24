import { IsOptional, IsEnum, IsUUID, IsString, IsInt } from 'class-validator';
import { QuestionLevel } from '../../database/entities/question.entity';
import { QuestionStatus } from '../../common/utils/question-status.util';
import { SelfRating } from '../../database/entities/practice-log.entity';
import { Type } from 'class-transformer';

export class QueryPracticeDto {
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
  @IsEnum(SelfRating)
  rating?: SelfRating;

  @IsOptional()
  @IsString()
  excludeQuestionId?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;
}
