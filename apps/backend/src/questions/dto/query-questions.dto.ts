import { IsOptional, IsEnum, IsString, IsUUID, IsBoolean } from 'class-validator';
import { QuestionLevel, QuestionStatus } from '../../database/entities/question.entity';
import { Type } from 'class-transformer';
import { SUPPORTED_LANGUAGES } from '../../i18n/i18n.middleware';

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

  @IsOptional()
  @IsEnum(SUPPORTED_LANGUAGES)
  lang?: typeof SUPPORTED_LANGUAGES[number];
}
