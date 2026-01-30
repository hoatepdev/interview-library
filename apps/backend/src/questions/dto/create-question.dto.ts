import { IsString, IsOptional, IsNotEmpty, IsEnum, IsBoolean, IsInt, MaxLength, IsUUID } from 'class-validator';
import { QuestionLevel, QuestionStatus } from '../../database/entities/question.entity';

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
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsInt()
  difficultyScore?: number;

  @IsOptional()
  @IsInt()
  order?: number;
}
