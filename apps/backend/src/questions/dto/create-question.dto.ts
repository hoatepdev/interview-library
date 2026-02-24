import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsInt,
  MaxLength,
  IsUUID,
} from "class-validator";
import { QuestionLevel } from "../../database/entities/question.entity";

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsString()
  @IsUUID()
  topicId: string;

  @IsOptional()
  @IsEnum(QuestionLevel)
  level?: QuestionLevel;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsInt()
  difficultyScore?: number;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}
