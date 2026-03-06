import {
  IsOptional,
  IsEnum,
  IsString,
  IsUUID,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { QuestionLevel } from "../../database/entities/question.entity";
import { QuestionStatus } from "../../common/utils/question-status.util";
import { ContentStatus } from "../../common/enums/content-status.enum";
import { Type } from "class-transformer";
import { LOCALES } from "@interview-library/shared/i18n";

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
  lang?: (typeof LOCALES)[number];

  @IsOptional()
  @IsEnum(ContentStatus)
  contentStatus?: ContentStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
