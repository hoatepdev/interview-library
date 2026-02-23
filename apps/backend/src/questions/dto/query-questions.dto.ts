import { IsOptional, IsEnum, IsString, IsUUID, IsBoolean } from 'class-validator';
import { QuestionLevel, QuestionStatus } from '../../database/entities/question.entity';
import { ContentStatus } from '../../common/enums/content-status.enum';
import { Type } from 'class-transformer';
import { LOCALES } from '@interview-library/shared/i18n';

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
  @IsEnum(LOCALES)
  lang?: typeof LOCALES[number];

  @IsOptional()
  @IsEnum(ContentStatus)
  contentStatus?: ContentStatus;
}
